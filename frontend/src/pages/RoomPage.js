// Single room view page

import { roomsApi } from '../services/api.js';
import { authState } from '../services/auth.js';
import { Loading } from '../components/common/Loading.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { SpeakerGrid, attachSpeakerVideoStream, updateSpeakerVideoFallback } from '../components/rooms/SpeakerTile.js';
import { RoomControls, attachRoomControlsEvents } from '../components/rooms/RoomControls.js';
import { ParticipantList, attachParticipantListEvents } from '../components/rooms/ParticipantList.js';
import { VideoPlayer, attachVideoStream, updateVideoFallback } from '../components/rooms/VideoPlayer.js';
import { createRoomConnection } from '../hooks/useWebRTC.js';
import { showError, showSuccess } from '../components/common/Toast.js';
import { openConfirmModal } from '../components/common/Modal.js';
import { navigate } from '../router.js';
import { icon } from '../utils/icons.js';

let roomConnection = null;

export async function RoomPage({ id }) {
  return `
    <div class="room-page">
      <div id="roomContent">
        ${Loading()}
      </div>
    </div>
  `;
}

export async function attachRoomPageEvents(container, { id }) {
  const content = container.querySelector('#roomContent');
  if (!content) return;

  try {
    // Join the room - now returns SDP offer directly
    const joinResponse = await roomsApi.join(id);
    const { room, role, sdp, iceServers, sessionId, videoQuality } = joinResponse;

    if (!room.isLive) {
      content.innerHTML = EmptyState({
        iconName: 'radio',
        title: 'Room has ended',
        message: 'This room is no longer live.',
        action: `<a href="#/rooms" class="btn btn-primary">Browse Rooms</a>`
      });
      return;
    }

    // Get full room data with participants
    const { room: fullRoom } = await roomsApi.getById(id);
    const participants = fullRoom.participants || [];
    const isHost = fullRoom.hostId === authState.user?._id;
    const raisedHands = fullRoom.raisedHands || [];

    // Build signaling object for RoomConnection
    const signaling = {
      sdp,
      iceServers,
      sessionId,
      videoQuality: videoQuality || '720p'
    };
    const canPublish = role === 'host' || role === 'speaker';

    // Setup WebRTC connection with video quality
    roomConnection = createRoomConnection(id, authState.user._id, role, signaling.videoQuality);
    await roomConnection.connect(signaling);

    // Track video state
    let isVideoOn = true;

    // Render room UI with video layout
    content.innerHTML = `
      <div class="room-view video-room">
        <div class="room-main">
          <div class="room-info" style="margin-bottom: 1rem;">
            <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${escapeHtml(fullRoom.name)}</h1>
            ${fullRoom.description ? `<p style="color: var(--text-muted)">${escapeHtml(fullRoom.description)}</p>` : ''}
            <span class="video-quality-badge">${videoQuality}</span>
          </div>
          <div class="video-stage" id="videoStage">
            ${canPublish ? `
              <div class="local-video-container">
                ${VideoPlayer({ user: authState.user, isLocal: true, isVideoOff: false })}
              </div>
            ` : `
              <div class="remote-video-container" id="remoteVideoContainer">
                <div class="waiting-for-video">
                  ${icon('video', 48)}
                  <p>Waiting for video stream...</p>
                </div>
              </div>
            `}
          </div>
          <div class="room-stage" id="roomStage" style="display: none;">
            ${SpeakerGrid(participants, { hasVideo: true })}
          </div>
          ${RoomControls({ isMuted: true, isVideoOn: true, role, isHost })}
        </div>
        <div class="room-sidebar">
          <div id="participantListContainer">
            ${ParticipantList({
              participants,
              isHost,
              raisedHands: participants.filter(p => raisedHands.includes(p.userId))
            })}
          </div>
        </div>
      </div>
    `;

    // Attach local video stream for publishers
    if (canPublish && roomConnection) {
      const localStream = roomConnection.getLocalVideoStream();
      if (localStream) {
        attachVideoStream('localVideo', localStream);
      }
    }

    // Handle incoming video track for listeners
    if (!canPublish && roomConnection) {
      roomConnection.onVideoTrack = (stream) => {
        const remoteContainer = content.querySelector('#remoteVideoContainer');
        if (remoteContainer) {
          // Get the host user for display
          const hostParticipant = participants.find(p => p.role === 'host');
          const hostUser = hostParticipant?.user || { username: 'Host' };
          remoteContainer.innerHTML = VideoPlayer({ user: hostUser, isLocal: false, isVideoOff: false });
          attachVideoStream(`remoteVideo-${hostUser._id || 'unknown'}`, stream);
        }
      };

      // Check if there's already a remote video stream
      const existingStream = roomConnection.getRemoteVideoStream();
      if (existingStream) {
        roomConnection.onVideoTrack(existingStream);
      }
    }

    // Attach control events
    attachRoomControlsEvents(content, {
      onToggleMute: (muted) => {
        if (roomConnection) {
          roomConnection.setMuted(muted);
        }
      },
      onToggleCamera: (enabled) => {
        if (roomConnection) {
          roomConnection.setVideoEnabled(enabled);
          isVideoOn = enabled;
          // Update local video fallback
          updateVideoFallback('localVideo', !enabled);
        }
      },
      onRaiseHand: async () => {
        try {
          await roomsApi.raiseHand(id);
          showSuccess('Hand raised!');
        } catch (error) {
          showError(error.message);
        }
      },
      onLeave: async () => {
        openConfirmModal({
          title: 'Leave Room',
          message: 'Are you sure you want to leave this room?',
          confirmText: 'Leave',
          danger: true,
          onConfirm: async () => {
            await leaveRoom(id);
          }
        });
      },
      onEnd: async () => {
        openConfirmModal({
          title: 'End Room',
          message: 'Are you sure you want to end this room for everyone?',
          confirmText: 'End Room',
          danger: true,
          onConfirm: async () => {
            await endRoom(id);
          }
        });
      }
    });

    // Attach participant list events
    const participantContainer = content.querySelector('#participantListContainer');
    if (participantContainer) {
      attachParticipantListEvents(participantContainer, {
        onPromote: async (userId) => {
          try {
            await roomsApi.promoteSpeaker(id, userId);
            showSuccess('User promoted to speaker');
            // Refresh participant list
            const { room: updatedRoom } = await roomsApi.getById(id);
            participantContainer.innerHTML = ParticipantList({
              participants: updatedRoom.participants || [],
              isHost,
              raisedHands: (updatedRoom.participants || []).filter(p =>
                (updatedRoom.raisedHands || []).includes(p.userId)
              )
            });
            attachParticipantListEvents(participantContainer, { onPromote });
          } catch (error) {
            showError(error.message);
          }
        }
      });
    }

    // Handle speaking indicator
    if (roomConnection) {
      roomConnection.onSpeakingChange = (userId, isSpeaking) => {
        const tile = content.querySelector(`[data-participant-id="${userId}"]`);
        if (tile) {
          tile.classList.toggle('speaking', isSpeaking);
        }
      };
    }

  } catch (error) {
    showError(error.message || 'Failed to join room');
    content.innerHTML = EmptyState({
      iconName: 'alert',
      title: 'Failed to join room',
      message: error.message,
      action: `<a href="#/rooms" class="btn btn-primary">Browse Rooms</a>`
    });
  }
}

async function leaveRoom(roomId) {
  try {
    if (roomConnection) {
      await roomConnection.disconnect();
      roomConnection = null;
    }
    await roomsApi.leave(roomId);
    navigate('/rooms');
  } catch (error) {
    showError(error.message);
  }
}

async function endRoom(roomId) {
  try {
    if (roomConnection) {
      await roomConnection.disconnect();
      roomConnection = null;
    }
    await roomsApi.end(roomId);
    navigate('/rooms');
    showSuccess('Room ended');
  } catch (error) {
    showError(error.message);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Cleanup when leaving page
window.addEventListener('hashchange', () => {
  if (roomConnection && !window.location.hash.includes('/rooms/')) {
    roomConnection.disconnect();
    roomConnection = null;
  }
});
