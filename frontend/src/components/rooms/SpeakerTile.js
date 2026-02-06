// Speaker tile component for room view

import { Avatar } from '../common/Avatar.js';
import { icon } from '../../utils/icons.js';

export function SpeakerTile({ participant, isMuted = false, isSpeaking = false, hasVideo = false, isVideoOff = false }) {
  const { user, role } = participant;

  const roleLabel = role === 'host' ? 'Host' :
                    role === 'speaker' ? 'Speaker' : 'Listener';

  const videoId = `video-${user._id}`;

  return `
    <div class="speaker-tile ${isSpeaking ? 'speaking' : ''} ${hasVideo ? 'has-video' : ''}" data-participant-id="${user._id}">
      ${hasVideo ? `
        <div class="speaker-video-container">
          <video id="${videoId}" autoplay playsinline muted></video>
          <div class="speaker-video-fallback ${isVideoOff ? 'visible' : ''}" id="${videoId}-fallback">
            ${Avatar({ user, size: 'lg' })}
          </div>
        </div>
      ` : Avatar({ user, size: 'lg' })}
      <div class="speaker-info">
        <span class="speaker-name">${user.displayName || user.username}</span>
        <span class="speaker-role">${roleLabel}</span>
      </div>
      ${isMuted ? `<span class="speaker-muted">${icon('micOff', 16)}</span>` : ''}
      ${hasVideo && isVideoOff ? `<span class="speaker-video-off">${icon('videoOff', 16)}</span>` : ''}
    </div>
  `;
}

export function attachSpeakerVideoStream(userId, stream) {
  const videoId = `video-${userId}`;
  const video = document.getElementById(videoId);
  if (video && stream) {
    video.srcObject = stream;
    video.play().catch(err => {
      console.warn('Video autoplay blocked:', err);
    });
  }
}

export function updateSpeakerVideoFallback(userId, isVideoOff) {
  const fallbackId = `video-${userId}-fallback`;
  const fallback = document.getElementById(fallbackId);
  if (fallback) {
    fallback.classList.toggle('visible', isVideoOff);
  }
}

export function SpeakerGrid(participants, options = {}) {
  const { hasVideo = false } = options;
  const speakers = participants.filter(p => p.role === 'host' || p.role === 'speaker');

  if (speakers.length === 0) {
    return '<p style="color: var(--text-muted); text-align: center;">No speakers yet</p>';
  }

  return speakers.map(p => SpeakerTile({ participant: p, hasVideo })).join('');
}
