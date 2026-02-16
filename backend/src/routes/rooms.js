import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  createRoom,
  getRoomById,
  getLiveRooms,
  updateRoom,
  deleteRoom,
  getUserById,
} from "../services/database.js";
import {
  addRoomParticipant,
  removeRoomParticipant,
  getRoomParticipants,
  updateParticipantRole,
  clearRoomParticipants,
  getActiveRooms,
  setRoomChannelId,
  getRoomChannelId,
  // New session tracking functions
  setRoomSession,
  getRoomSession,
  deleteRoomSession,
  updateSessionLastSeen,
  clearAllRoomSessions,
  // SSE broadcasting
  ROOM_EVENTS,
  addRoomConnection,
  removeRoomConnection,
  broadcastToRoom,
} from "../services/redis.js";
import smbService from "../services/smb.js";
import { createSdpOffer, parseAnswerForConfiguration } from "../services/connection.js";
import { authenticate, verifyToken } from "../middleware/auth.js";
import { validate, createRoomRules } from "../middleware/validation.js";

const router = Router();

// Get live rooms
router.get("/", async (req, res, next) => {
  try {
    // Get rooms from database
    const rooms = await getLiveRooms(20);

    // Get active rooms with participant counts from Redis
    const activeRooms = await getActiveRooms(20);
    const participantCounts = {};
    activeRooms.forEach((r) => {
      participantCounts[r.roomId] = r.participantCount;
    });

    // Enrich rooms with participant counts and host info
    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const host = await getUserById(room.hostId);
        if (host) delete host.password;

        return {
          ...room,
          host,
          participantCount: participantCounts[room._id] || 0,
        };
      }),
    );

    // Sort by participant count
    enrichedRooms.sort((a, b) => b.participantCount - a.participantCount);

    res.json({ rooms: enrichedRooms });
  } catch (error) {
    next(error);
  }
});

// Get single room
router.get("/:id", async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const host = await getUserById(room.hostId);
    if (host) delete host.password;

    // Get participants
    const participants = await getRoomParticipants(room._id);

    // Get participant user details
    const participantUsers = await Promise.all(
      participants.map(async (p) => {
        const user = await getUserById(p.userId);
        if (user) delete user.password;
        return {
          ...p,
          user,
        };
      }),
    );

    res.json({
      room: {
        ...room,
        host,
        participants: participantUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// SSE endpoint for real-time room events
router.get("/:id/events", async (req, res, next) => {
  try {
    // Authenticate via query param (EventSource doesn't support headers)
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decoded.userId;

    // Verify room exists
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: "connected", userId, timestamp: Date.now() })}\n\n`);

    // Add connection to room
    addRoomConnection(room._id, res);

    // Send keepalive ping every 30 seconds
    const keepaliveInterval = setInterval(() => {
      try {
        res.write(`: keepalive\n\n`);
      } catch {
        clearInterval(keepaliveInterval);
      }
    }, 30000);

    // Cleanup on close
    req.on("close", () => {
      clearInterval(keepaliveInterval);
      removeRoomConnection(room._id, res);
    });

    req.on("error", () => {
      clearInterval(keepaliveInterval);
      removeRoomConnection(room._id, res);
    });

  } catch (error) {
    next(error);
  }
});

// Create room
router.post(
  "/",
  authenticate,
  createRoomRules,
  validate,
  async (req, res, next) => {
    try {
      const { name, description, isPrivate } = req.body;

      const roomId = uuidv4();

      // Create SMB conference - SMB generates its own conference ID
      const { conferenceId: smbConferenceId } = await smbService.createConference();

      const room = await createRoom({
        _id: roomId,
        name,
        description: description || "",
        hostId: req.userId,
        isPrivate: isPrivate || false,
        isLive: true,
        smbConferenceId,  // Store the SMB-generated conference ID
        speakers: [req.userId],
        raisedHands: [],
        settings: {
          maxParticipants: 100,
          allowChat: true,
          recordingEnabled: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Add host as first participant with speaker role
      await addRoomParticipant(room._id, req.userId, "speaker");

      res.status(201).json({
        room: {
          ...room,
          host: req.user,
          participants: [
            {
              userId: req.userId,
              role: "speaker",
              user: req.user,
            },
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Join room - Now returns SDP offer for direct SMB connection
router.post("/:id/join", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (!room.isLive) {
      return res.status(400).json({ error: "Room is not live" });
    }

    // Determine role (speakers or listener)
    const isSpeaker = room.speakers?.includes(req.userId);
    const role =
      room.hostId === req.userId ? "host" : isSpeaker ? "speaker" : "listener";

    // Add participant to Redis
    await addRoomParticipant(room._id, req.userId, role);

    // Get or create SMB conference ID with optimistic concurrency control
    let smbConferenceId = room.smbConferenceId;
    if (!smbConferenceId) {
      // Room was created before migration - create conference now
      console.log(`[JOIN] Room ${room._id} missing smbConferenceId, creating conference...`);
      const { conferenceId } = await smbService.createConference();

      // Re-fetch room to check if another request already set smbConferenceId (race condition)
      const updatedRoom = await getRoomById(room._id);
      if (updatedRoom.smbConferenceId) {
        // Another request already created a conference - use that one instead
        console.log(`[JOIN] Race condition detected: using existing conference ${updatedRoom.smbConferenceId} instead of ${conferenceId}`);
        smbConferenceId = updatedRoom.smbConferenceId;
        // Clean up the orphaned conference we just created
        try {
          await smbService.deleteConference(conferenceId);
        } catch (cleanupErr) {
          console.warn(`[JOIN] Failed to cleanup orphaned conference ${conferenceId}:`, cleanupErr.message);
        }
      } else {
        // We won the race - use our conference
        smbConferenceId = conferenceId;
        await updateRoom(room._id, { smbConferenceId });
      }
    }

    // Create unique endpoint ID for this connection (must be <= 36 chars for SMB)
    const endpointId = uuidv4();

    // Allocate SMB endpoint with retry on 404 (conference may have expired on SMB side)
    console.log(`[JOIN] Allocating endpoint for user ${req.userId} in conference ${smbConferenceId}`);
    let endpointDescription;
    try {
      endpointDescription = await smbService.allocateEndpoint(
        smbConferenceId,
        endpointId,
        {
          audio: true,
          data: true,
          relayType: 'ssrc-rewrite',
          idleTimeout: 300 // 5 minutes
        }
      );
    } catch (allocError) {
      // If conference not found (404), it may have expired on SMB - recreate it
      if (allocError.message.includes('404')) {
        console.log(`[JOIN] Conference ${smbConferenceId} not found on SMB, recreating...`);
        const { conferenceId: newConferenceId } = await smbService.createConference();
        smbConferenceId = newConferenceId;
        await updateRoom(room._id, { smbConferenceId });
        // Retry allocation with new conference
        endpointDescription = await smbService.allocateEndpoint(
          smbConferenceId,
          endpointId,
          {
            audio: true,
            data: true,
            relayType: 'ssrc-rewrite',
            idleTimeout: 300
          }
        );
      } else {
        throw allocError;
      }
    }

    // Generate SDP offer from endpoint description
    const sdpOffer = createSdpOffer(endpointDescription, endpointId);

    // Store session in Redis for answer handling
    await setRoomSession(room._id, req.userId, {
      endpointId,
      endpointDescription,
      joinedAt: Date.now()
    });

    // Get ICE servers for client
    const iceServers = smbService.getIceServers();

    console.log(`[JOIN] User ${req.userId} joined room ${room._id} as ${role}`);

    // Broadcast participant joined event
    broadcastToRoom(room._id, ROOM_EVENTS.PARTICIPANT_JOINED, {
      userId: req.userId,
      user: { username: req.user.username, avatar: req.user.avatar },
      role
    });

    res.json({
      room,
      role,
      sdp: sdpOffer,
      iceServers,
      sessionId: endpointId
    });
  } catch (error) {
    console.error('[JOIN] Error:', error);
    next(error);
  }
});

// Submit SDP answer - Configure SMB endpoint with client's ICE/DTLS parameters
router.post("/:id/answer", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const { sdpAnswer } = req.body;
    if (!sdpAnswer) {
      return res.status(400).json({ error: "sdpAnswer is required" });
    }

    // Get session from Redis
    const session = await getRoomSession(room._id, req.userId);
    if (!session) {
      return res.status(400).json({ error: "No active session found. Please join the room first." });
    }

    // Parse SDP answer to extract ICE/DTLS parameters
    const configuredEndpoint = parseAnswerForConfiguration(
      sdpAnswer,
      session.endpointDescription
    );

    // Configure SMB endpoint with client's parameters
    await smbService.configureEndpoint(
      room.smbConferenceId,
      session.endpointId,
      configuredEndpoint
    );

    // Update session with configured state
    await setRoomSession(room._id, req.userId, {
      ...session,
      configured: true,
      configuredAt: Date.now()
    });

    console.log(`[ANSWER] Configured endpoint for user ${req.userId} in room ${room._id}`);

    res.json({ success: true });
  } catch (error) {
    console.error('[ANSWER] Error:', error);
    next(error);
  }
});

// Heartbeat - Keep session alive
router.post("/:id/heartbeat", authenticate, async (req, res, next) => {
  try {
    const updated = await updateSessionLastSeen(req.params.id, req.userId);

    if (!updated) {
      return res.status(404).json({ error: "No active session found" });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Leave room
router.post("/:id/leave", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Get session to cleanup SMB endpoint
    const session = await getRoomSession(room._id, req.userId);
    if (session && room.smbConferenceId) {
      // Delete SMB endpoint
      try {
        await smbService.deleteEndpoint(room.smbConferenceId, session.endpointId);
      } catch {
        // Best-effort cleanup
      }
      // Delete session from Redis
      await deleteRoomSession(room._id, req.userId);
    }

    await removeRoomParticipant(room._id, req.userId);

    // Broadcast participant left event
    broadcastToRoom(room._id, ROOM_EVENTS.PARTICIPANT_LEFT, {
      userId: req.userId,
      user: { username: req.user.username }
    });

    // If host leaves, end the room
    if (room.hostId === req.userId) {
      await updateRoom(room._id, {
        isLive: false,
        endedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Broadcast room ended event before clearing participants
      broadcastToRoom(room._id, ROOM_EVENTS.ROOM_ENDED, {
        reason: "host_left"
      });

      await clearRoomParticipants(room._id);
      await clearAllRoomSessions(room._id);

      if (room.smbConferenceId) {
        try {
          await smbService.deleteConference(room.smbConferenceId);
        } catch {
          // SMB cleanup is best-effort
        }
      }
    }

    res.json({ message: "Left room successfully" });
  } catch (error) {
    next(error);
  }
});

// Raise hand
router.post("/:id/raise-hand", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const raisedHands = room.raisedHands || [];
    if (!raisedHands.includes(req.userId)) {
      await updateRoom(room._id, {
        raisedHands: [...raisedHands, req.userId],
        updatedAt: new Date().toISOString(),
      });

      // Broadcast hand raised event
      broadcastToRoom(room._id, ROOM_EVENTS.HAND_RAISED, {
        userId: req.userId,
        user: { username: req.user.username, avatar: req.user.avatar }
      });
    }

    res.json({ message: "Hand raised" });
  } catch (error) {
    next(error);
  }
});

// Lower hand
router.post("/:id/lower-hand", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    await updateRoom(room._id, {
      raisedHands: (room.raisedHands || []).filter((id) => id !== req.userId),
      updatedAt: new Date().toISOString(),
    });

    // Broadcast hand lowered event
    broadcastToRoom(room._id, ROOM_EVENTS.HAND_LOWERED, {
      userId: req.userId,
      user: { username: req.user.username }
    });

    res.json({ message: "Hand lowered" });
  } catch (error) {
    next(error);
  }
});

// Promote to speaker (host only)
router.post("/:id/speakers/:userId", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.hostId !== req.userId) {
      return res.status(403).json({ error: "Only host can promote speakers" });
    }

    const targetUserId = req.params.userId;
    const speakers = room.speakers || [];

    if (!speakers.includes(targetUserId)) {
      await updateRoom(room._id, {
        speakers: [...speakers, targetUserId],
        raisedHands: (room.raisedHands || []).filter(
          (id) => id !== targetUserId,
        ),
        updatedAt: new Date().toISOString(),
      });

      await updateParticipantRole(room._id, targetUserId, "speaker");

      // Get promoted user's info for broadcast
      const promotedUser = await getUserById(targetUserId);

      // Broadcast speaker promoted event
      broadcastToRoom(room._id, ROOM_EVENTS.SPEAKER_PROMOTED, {
        userId: targetUserId,
        user: promotedUser ? { username: promotedUser.username, avatar: promotedUser.avatar } : null,
        promotedBy: req.userId
      });
    }

    res.json({ message: "User promoted to speaker" });
  } catch (error) {
    next(error);
  }
});

// Demote from speaker (host only)
router.delete("/:id/speakers/:userId", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.hostId !== req.userId) {
      return res.status(403).json({ error: "Only host can demote speakers" });
    }

    const targetUserId = req.params.userId;

    await updateRoom(room._id, {
      speakers: (room.speakers || []).filter((id) => id !== targetUserId),
      updatedAt: new Date().toISOString(),
    });

    await updateParticipantRole(room._id, targetUserId, "listener");

    // Get demoted user's info for broadcast
    const demotedUser = await getUserById(targetUserId);

    // Broadcast speaker demoted event
    broadcastToRoom(room._id, ROOM_EVENTS.SPEAKER_DEMOTED, {
      userId: targetUserId,
      user: demotedUser ? { username: demotedUser.username } : null,
      demotedBy: req.userId
    });

    res.json({ message: "User demoted to listener" });
  } catch (error) {
    next(error);
  }
});

// End room (host only)
router.post("/:id/end", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.hostId !== req.userId) {
      return res.status(403).json({ error: "Only host can end the room" });
    }

    await updateRoom(room._id, {
      isLive: false,
      endedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Broadcast room ended event before clearing participants
    broadcastToRoom(room._id, ROOM_EVENTS.ROOM_ENDED, {
      reason: "host_ended",
      endedBy: req.userId
    });

    await clearRoomParticipants(room._id);
    await clearAllRoomSessions(room._id);

    if (room.smbConferenceId) {
      try {
        await smbService.deleteConference(room.smbConferenceId);
      } catch {
        // SMB cleanup is best-effort
      }
    }

    res.json({ message: "Room ended successfully" });
  } catch (error) {
    next(error);
  }
});

// Store channel ID for a room (called by publisher after WHIP connect)
router.post("/:id/channel", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Only speakers/hosts can set the channel ID
    const isSpeaker =
      room.speakers?.includes(req.userId) || room.hostId === req.userId;
    if (!isSpeaker) {
      return res
        .status(403)
        .json({ error: "Only speakers can set channel ID" });
    }

    const { channelId } = req.body;
    if (!channelId) {
      return res.status(400).json({ error: "channelId is required" });
    }

    await setRoomChannelId(room._id, channelId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get channel ID for a room
router.get("/:id/channel", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const channelId = await getRoomChannelId(room._id);
    res.json({ channelId });
  } catch (error) {
    next(error);
  }
});

export default router;
