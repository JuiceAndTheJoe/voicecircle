// Single room view page - Audio-only with Push-to-Talk (PTT)

import { roomsApi } from '../services/api.js';
import { authState } from '../services/auth.js';
import { Loading } from '../components/common/Loading.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { RoomControls, attachRoomControlsEvents, updatePTTButtonState, cleanupRoomControls } from '../components/rooms/RoomControls.js';
import { ParticipantList, attachParticipantListEvents } from '../components/rooms/ParticipantList.js';
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
    const { room, role, sdp, iceServers, sessionId } = joinResponse;

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
      sessionId
    };
    const canSpeak = role === 'host' || role === 'speaker';

    // Setup WebRTC connection (audio-only)
    roomConnection = createRoomConnection(id, authState.user._id, role);
    await roomConnection.connect(signaling);

    // Render audio-only room UI with PTT
    content.innerHTML = `
      <div class="room-view audio-room">
        <div class="room-main">
          <div class="room-header">
            <div class="room-info">
              <h1>${escapeHtml(fullRoom.name)}</h1>
              ${fullRoom.description ? `<p class="room-description">${escapeHtml(fullRoom.description)}</p>` : ''}
            </div>
            <div class="room-status">
              <span class="live-badge">${icon('radio', 16)} LIVE</span>
              <span class="participant-count">${participants.length} ${participants.length === 1 ? 'participant' : 'participants'}</span>
            </div>
          </div>

          <div class="audio-stage" id="audioStage">
            <div class="speakers-area">
              ${renderSpeakersList(participants.filter(p => p.role === 'host' || p.role === 'speaker'))}
            </div>

            ${canSpeak ? `
              <div class="ptt-status" id="pttStatus">
                <div class="ptt-indicator">
                  ${icon('micOff', 32)}
                </div>
                <p class="ptt-hint">Hold the button below or press <kbd>T</kbd> to talk</p>
              </div>
            ` : `
              <div class="listener-status">
                <div class="listening-indicator">
                  ${icon('headphones', 32)}
                </div>
                <p>Listening to the conversation</p>
                <p class="listener-hint">Raise your hand if you'd like to speak</p>
              </div>
            `}
          </div>

          ${RoomControls({ role, isHost })}
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

    // Handle PTT state changes for UI feedback
    if (roomConnection && canSpeak) {
      roomConnection.onTalkingStateChange = (isTalking) => {
        updatePTTButtonState(content, isTalking);
        updatePTTStatusIndicator(content, isTalking);
      };
    }

    // Attach control events
    attachRoomControlsEvents(content, {
      onPTTStart: () => {
        if (roomConnection) {
          roomConnection.startPTT();
        }
      },
      onPTTEnd: () => {
        if (roomConnection) {
          roomConnection.stopPTT();
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
            await leaveRoom(id, content);
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
            await endRoom(id, content);
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
            // Re-attach events after re-render
            attachParticipantListEvents(participantContainer, { onPromote });
            // Update speakers area
            const speakersArea = content.querySelector('.speakers-area');
            if (speakersArea) {
              speakersArea.innerHTML = renderSpeakersList(
                (updatedRoom.participants || []).filter(p => p.role === 'host' || p.role === 'speaker')
              );
            }
          } catch (error) {
            showError(error.message);
          }
        }
      });
    }

    // Handle speaking indicator
    if (roomConnection) {
      roomConnection.onSpeakingChange = (userId, isSpeaking) => {
        const speakerCard = content.querySelector(`[data-speaker-id="${userId}"]`);
        if (speakerCard) {
          speakerCard.classList.toggle('speaking', isSpeaking);
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

// Render the speakers list (audio-only cards)
function renderSpeakersList(speakers) {
  if (!speakers || speakers.length === 0) {
    return '<p class="no-speakers">No speakers yet</p>';
  }

  return speakers.map(speaker => `
    <div class="speaker-card" data-speaker-id="${speaker.userId}">
      <div class="speaker-avatar">
        ${speaker.user?.avatar
          ? `<img src="${speaker.user.avatar}" alt="${escapeHtml(speaker.user?.username || 'Speaker')}" />`
          : `<div class="avatar-placeholder">${(speaker.user?.username || 'S')[0].toUpperCase()}</div>`
        }
        <div class="speaking-ring"></div>
      </div>
      <div class="speaker-info">
        <span class="speaker-name">${escapeHtml(speaker.user?.username || 'Unknown')}</span>
        ${speaker.role === 'host' ? `<span class="role-badge host">${icon('crown', 12)} Host</span>` : ''}
      </div>
    </div>
  `).join('');
}

// Update PTT status indicator
function updatePTTStatusIndicator(container, isTalking) {
  const pttStatus = container.querySelector('#pttStatus');
  if (pttStatus) {
    const indicator = pttStatus.querySelector('.ptt-indicator');
    const hint = pttStatus.querySelector('.ptt-hint');

    if (isTalking) {
      pttStatus.classList.add('talking');
      indicator.innerHTML = icon('mic', 32);
      hint.textContent = 'You are transmitting...';
    } else {
      pttStatus.classList.remove('talking');
      indicator.innerHTML = icon('micOff', 32);
      hint.innerHTML = 'Hold the button below or press <kbd>T</kbd> to talk';
    }
  }
}

async function leaveRoom(roomId, container) {
  try {
    // Cleanup keyboard listeners
    cleanupRoomControls(container);

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

async function endRoom(roomId, container) {
  try {
    // Cleanup keyboard listeners
    cleanupRoomControls(container);

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
