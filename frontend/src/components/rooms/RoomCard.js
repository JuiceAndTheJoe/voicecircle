// Room preview card component

import { Avatar, AvatarGroup } from '../common/Avatar.js';
import { icon } from '../../utils/icons.js';

export function RoomCard(room) {
  const { _id, name, description, host, participants = [], participantCount = 0, isLive } = room;

  // Get speaker avatars (first 3 participants)
  const speakerUsers = participants.slice(0, 3).map(p => p.user).filter(Boolean);

  return `
    <div class="room-card" data-room-id="${_id}">
      <div class="room-header">
        <h3 class="room-title">${escapeHtml(name)}</h3>
        ${isLive ? '<span class="room-live-badge">LIVE</span>' : ''}
      </div>
      ${description ? `<p class="room-description">${escapeHtml(description)}</p>` : ''}
      <div class="room-footer">
        <div class="room-participants">
          ${speakerUsers.length > 0 ? AvatarGroup({ users: speakerUsers, max: 3, size: 'sm' }) : ''}
          <span class="room-count">${participantCount} listening</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted);">
          ${icon('headphones', 16)}
          <span style="font-size: 0.875rem;">Hosted by ${host?.displayName || host?.username || 'Unknown'}</span>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function attachRoomCardEvents(container) {
  container.querySelectorAll('[data-room-id]').forEach(card => {
    card.addEventListener('click', () => {
      const roomId = card.dataset.roomId;
      window.location.hash = `#/rooms/${roomId}`;
    });
  });
}
