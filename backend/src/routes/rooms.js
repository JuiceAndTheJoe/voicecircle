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
} from "../services/redis.js";
import smbService from "../services/smb.js";
import { authenticate } from "../middleware/auth.js";
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

// Create room
router.post(
  "/",
  authenticate,
  createRoomRules,
  validate,
  async (req, res, next) => {
    try {
      const { name, description, isPrivate, enableVideo } = req.body;

      const roomId = uuidv4();

      // Conference will be created automatically on first join
      // No need to create it here

      const room = await createRoom({
        _id: roomId,
        name,
        description: description || "",
        hostId: req.userId,
        isPrivate: isPrivate || false,
        enableVideo: enableVideo || false,
        isLive: true,
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

// Join room
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

    // Get signaling info
    const signaling = await smbService.getRoomSignaling(
      room._id,
      req.userId,
      role === "host" || role === "speaker",
    );

    // Add channel ID if available (for WHEP subscribers)
    const channelId = await getRoomChannelId(room._id);
    if (channelId) {
      signaling.channelId = channelId;
    }

    res.json({
      room,
      role,
      signaling,
    });
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

    await removeRoomParticipant(room._id, req.userId);

    // If host leaves, end the room
    if (room.hostId === req.userId) {
      await updateRoom(room._id, {
        isLive: false,
        endedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await clearRoomParticipants(room._id);

      try {
        await smbService.deleteConference(room._id);
      } catch (err) {
        console.error("Failed to delete SMB conference:", err.message);
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

    await clearRoomParticipants(room._id);

    try {
      await smbService.deleteConference(room._id);
    } catch (err) {
      console.error("Failed to delete SMB conference:", err.message);
    }

    res.json({ message: "Room ended successfully" });
  } catch (error) {
    next(error);
  }
});

// Get WebRTC signaling info
router.get("/:id/signaling", authenticate, async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const isSpeaker =
      room.speakers?.includes(req.userId) || room.hostId === req.userId;
    const signaling = await smbService.getRoomSignaling(
      room._id,
      req.userId,
      isSpeaker,
    );

    // Add channel ID if available (for WHEP subscribers)
    const channelId = await getRoomChannelId(room._id);
    if (channelId) {
      signaling.channelId = channelId;
    }

    res.json({ signaling });
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
      return res.status(403).json({ error: "Only speakers can set channel ID" });
    }

    const { channelId } = req.body;
    if (!channelId) {
      return res.status(400).json({ error: "channelId is required" });
    }

    await setRoomChannelId(room._id, channelId);
    console.log(`Channel ID set for room ${room._id}: ${channelId}`);

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
