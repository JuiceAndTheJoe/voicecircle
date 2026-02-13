// Speaker tile component for room view

import { Avatar } from '../common/Avatar.js';
import { icon } from '../../utils/icons.js';

export function SpeakerTile({ participant, isMuted = false, isSpeaking = false }) {
  const { user, role } = participant;

  const roleLabel = role === 'host' ? 'Host' :
                    role === 'speaker' ? 'Speaker' : 'Listener';

  return `
    <div class="speaker-tile ${isSpeaking ? 'speaking' : ''}" data-participant-id="${user._id}">
      ${Avatar({ user, size: 'lg' })}
      <div class="speaker-info">
        <span class="speaker-name">${user.displayName || user.username}</span>
        <span class="speaker-role">${roleLabel}</span>
      </div>
      ${isMuted ? `<span class="speaker-muted">${icon('micOff', 16)}</span>` : ''}
    </div>
  `;
}

export function SpeakerGrid(participants) {
  const speakers = participants.filter(p => p.role === 'host' || p.role === 'speaker');

  if (speakers.length === 0) {
    return '<p style="color: var(--text-muted); text-align: center;">No speakers yet</p>';
  }

  return speakers.map(p => SpeakerTile({ participant: p })).join('');
}
