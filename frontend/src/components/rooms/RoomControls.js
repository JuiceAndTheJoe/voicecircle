// Room controls component

import { icon } from '../../utils/icons.js';

export function RoomControls({ isMuted = true, isVideoOn = true, role = 'listener', isHost = false }) {
  const canSpeak = role === 'host' || role === 'speaker';

  return `
    <div class="room-controls">
      ${canSpeak ? `
        <button class="control-btn ${isMuted ? 'muted' : ''}" id="muteBtn" title="${isMuted ? 'Unmute' : 'Mute'}">
          ${isMuted ? icon('micOff', 24) : icon('mic', 24)}
        </button>
        <button class="control-btn ${isVideoOn ? '' : 'muted'}" id="cameraBtn" title="${isVideoOn ? 'Turn off camera' : 'Turn on camera'}">
          ${isVideoOn ? icon('video', 24) : icon('videoOff', 24)}
        </button>
      ` : `
        <button class="control-btn" id="raiseHandBtn" title="Raise hand">
          ${icon('hand', 24)}
        </button>
      `}
      <button class="control-btn leave" id="leaveRoomBtn" title="Leave room">
        ${icon('phoneOff', 24)}
      </button>
      ${isHost ? `
        <button class="control-btn" id="endRoomBtn" title="End room" style="background: var(--danger);">
          ${icon('x', 24)}
        </button>
      ` : ''}
    </div>
  `;
}

export function attachRoomControlsEvents(container, handlers = {}) {
  const muteBtn = container.querySelector('#muteBtn');
  const cameraBtn = container.querySelector('#cameraBtn');
  const raiseHandBtn = container.querySelector('#raiseHandBtn');
  const leaveRoomBtn = container.querySelector('#leaveRoomBtn');
  const endRoomBtn = container.querySelector('#endRoomBtn');

  if (muteBtn && handlers.onToggleMute) {
    muteBtn.addEventListener('click', () => {
      const isMuted = muteBtn.classList.contains('muted');
      handlers.onToggleMute(!isMuted);
      muteBtn.classList.toggle('muted');
      muteBtn.innerHTML = isMuted ? icon('mic', 24) : icon('micOff', 24);
    });
  }

  if (cameraBtn && handlers.onToggleCamera) {
    cameraBtn.addEventListener('click', () => {
      const isVideoOn = !cameraBtn.classList.contains('muted');
      handlers.onToggleCamera(!isVideoOn);
      cameraBtn.classList.toggle('muted');
      cameraBtn.innerHTML = isVideoOn ? icon('videoOff', 24) : icon('video', 24);
    });
  }

  if (raiseHandBtn && handlers.onRaiseHand) {
    raiseHandBtn.addEventListener('click', () => {
      handlers.onRaiseHand();
    });
  }

  if (leaveRoomBtn && handlers.onLeave) {
    leaveRoomBtn.addEventListener('click', () => {
      handlers.onLeave();
    });
  }

  if (endRoomBtn && handlers.onEnd) {
    endRoomBtn.addEventListener('click', () => {
      handlers.onEnd();
    });
  }
}
