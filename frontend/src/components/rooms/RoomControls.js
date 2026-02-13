// Room controls component - Audio-only with Push-to-Talk (PTT)

import { icon } from '../../utils/icons.js';

export function RoomControls({ role = 'listener', isHost = false }) {
  const canSpeak = role === 'host' || role === 'speaker';

  return `
    <div class="room-controls">
      ${canSpeak ? `
        <button class="control-btn ptt-btn" id="pttBtn" title="Hold to talk (or press T)">
          ${icon('mic', 24)}
          <span class="ptt-label">Hold to Talk</span>
        </button>
      ` : `
        <button class="control-btn" id="raiseHandBtn" title="Raise hand to speak">
          ${icon('hand', 24)}
        </button>
      `}
      <button class="control-btn leave" id="leaveRoomBtn" title="Leave room">
        ${icon('phoneOff', 24)}
      </button>
      ${isHost ? `
        <button class="control-btn danger" id="endRoomBtn" title="End room for everyone">
          ${icon('x', 24)}
        </button>
      ` : ''}
    </div>
  `;
}

export function attachRoomControlsEvents(container, handlers = {}) {
  const pttBtn = container.querySelector('#pttBtn');
  const raiseHandBtn = container.querySelector('#raiseHandBtn');
  const leaveRoomBtn = container.querySelector('#leaveRoomBtn');
  const endRoomBtn = container.querySelector('#endRoomBtn');

  // Push-to-Talk button - pointer events for cross-platform support
  if (pttBtn && handlers.onPTTStart && handlers.onPTTEnd) {
    // Pointer down - start PTT
    pttBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pttBtn.classList.add('active');
      handlers.onPTTStart();
    });

    // Pointer up - stop PTT
    pttBtn.addEventListener('pointerup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pttBtn.classList.remove('active');
      handlers.onPTTEnd();
    });

    // Pointer leave - stop PTT (in case user drags off button)
    pttBtn.addEventListener('pointerleave', (e) => {
      if (pttBtn.classList.contains('active')) {
        pttBtn.classList.remove('active');
        handlers.onPTTEnd();
      }
    });

    // Pointer cancel - stop PTT
    pttBtn.addEventListener('pointercancel', (e) => {
      pttBtn.classList.remove('active');
      handlers.onPTTEnd();
    });

    // Prevent context menu on long press (mobile)
    pttBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  // Keyboard support for PTT (T key)
  if (handlers.onPTTStart && handlers.onPTTEnd) {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      // Ignore key repeat
      if (e.repeat) return;

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        if (pttBtn) pttBtn.classList.add('active');
        handlers.onPTTStart();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        if (pttBtn) pttBtn.classList.remove('active');
        handlers.onPTTEnd();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Store cleanup function for later removal
    container._pttKeyboardCleanup = () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }

  // Raise hand button for listeners
  if (raiseHandBtn && handlers.onRaiseHand) {
    raiseHandBtn.addEventListener('click', () => {
      handlers.onRaiseHand();
    });
  }

  // Leave room button
  if (leaveRoomBtn && handlers.onLeave) {
    leaveRoomBtn.addEventListener('click', () => {
      handlers.onLeave();
    });
  }

  // End room button (host only)
  if (endRoomBtn && handlers.onEnd) {
    endRoomBtn.addEventListener('click', () => {
      handlers.onEnd();
    });
  }
}

// Update PTT button state (called when talking state changes)
export function updatePTTButtonState(container, isTalking) {
  const pttBtn = container.querySelector('#pttBtn');
  if (pttBtn) {
    if (isTalking) {
      pttBtn.classList.add('talking');
      pttBtn.querySelector('.ptt-label').textContent = 'Talking...';
    } else {
      pttBtn.classList.remove('talking');
      pttBtn.querySelector('.ptt-label').textContent = 'Hold to Talk';
    }
  }
}

// Cleanup function to remove keyboard listeners
export function cleanupRoomControls(container) {
  if (container._pttKeyboardCleanup) {
    container._pttKeyboardCleanup();
    delete container._pttKeyboardCleanup;
  }
}
