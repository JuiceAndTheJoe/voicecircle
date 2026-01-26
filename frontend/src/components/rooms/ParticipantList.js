// Participant list component for room sidebar

import { Avatar } from '../common/Avatar.js';
import { icon } from '../../utils/icons.js';

export function ParticipantList({ participants, isHost = false, raisedHands = [] }) {
  const speakers = participants.filter(p => p.role === 'host' || p.role === 'speaker');
  const listeners = participants.filter(p => p.role === 'listener');

  return `
    <div class="participants-list">
      <h3>Speakers (${speakers.length})</h3>
      ${speakers.map(p => ParticipantItem({ participant: p, isHost })).join('')}

      ${raisedHands.length > 0 ? `
        <h3 style="margin-top: 1rem;">Raised Hands (${raisedHands.length})</h3>
        ${raisedHands.map(p => ParticipantItem({ participant: p, isHost, hasRaisedHand: true })).join('')}
      ` : ''}

      ${listeners.length > 0 ? `
        <h3 style="margin-top: 1rem;">Listeners (${listeners.length})</h3>
        ${listeners.map(p => ParticipantItem({ participant: p, isHost })).join('')}
      ` : ''}
    </div>
  `;
}

function ParticipantItem({ participant, isHost = false, hasRaisedHand = false }) {
  const { user, role } = participant;

  const roleIcon = role === 'host' ? icon('user', 14) :
                   role === 'speaker' ? icon('mic', 14) :
                   hasRaisedHand ? icon('hand', 14) : '';

  return `
    <div class="participant-item" data-participant-id="${user._id}">
      ${Avatar({ user, size: 'sm', showOnline: true })}
      <div class="participant-info">
        <span class="participant-name">${user.displayName || user.username}</span>
        <span class="participant-role">${role === 'host' ? 'Host' : role === 'speaker' ? 'Speaker' : ''}</span>
      </div>
      ${hasRaisedHand ? `<span style="color: var(--warning)">${icon('hand', 16)}</span>` : ''}
      ${isHost && role === 'listener' ? `
        <button class="btn btn-sm btn-secondary" data-promote-user="${user._id}" title="Make speaker">
          ${icon('mic', 14)}
        </button>
      ` : ''}
    </div>
  `;
}

export function attachParticipantListEvents(container, handlers = {}) {
  container.querySelectorAll('[data-promote-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.promoteUser;
      if (handlers.onPromote) {
        handlers.onPromote(userId);
      }
    });
  });
}
