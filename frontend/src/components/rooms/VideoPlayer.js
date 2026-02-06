// Video player component for displaying video streams

import { Avatar } from '../common/Avatar.js';

export function VideoPlayer({ stream, user, isLocal = false, isMuted = false, isVideoOff = false }) {
  const name = user?.displayName || user?.username || 'Unknown';
  const videoId = isLocal ? 'localVideo' : `remoteVideo-${user?._id || 'unknown'}`;

  return `
    <div class="video-player ${isLocal ? 'local' : 'remote'}" data-user-id="${user?._id || ''}">
      <div class="video-container">
        <video id="${videoId}" autoplay playsinline ${isLocal ? 'muted' : ''}></video>
        <div class="video-avatar-fallback ${isVideoOff ? 'visible' : ''}" id="${videoId}-fallback">
          ${Avatar({ user, size: 'xl' })}
        </div>
      </div>
      <div class="video-overlay">
        <span class="video-name">${escapeHtml(name)}</span>
        ${isMuted ? '<span class="video-muted-indicator"></span>' : ''}
      </div>
    </div>
  `;
}

export function attachVideoStream(videoElementId, stream) {
  const video = document.getElementById(videoElementId);
  if (video && stream) {
    video.srcObject = stream;
    video.play().catch(err => {
      console.warn('Video autoplay blocked:', err);
    });

    // Show/hide fallback based on video tracks
    const fallback = document.getElementById(`${videoElementId}-fallback`);
    if (fallback) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        fallback.classList.toggle('visible', !videoTrack.enabled);
        videoTrack.onmute = () => fallback.classList.add('visible');
        videoTrack.onunmute = () => fallback.classList.remove('visible');
      }
    }
  }
}

export function updateVideoFallback(videoElementId, isVideoOff) {
  const fallback = document.getElementById(`${videoElementId}-fallback`);
  if (fallback) {
    fallback.classList.toggle('visible', isVideoOff);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
