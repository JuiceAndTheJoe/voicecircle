// Audio playback component

import { icon } from "../../utils/icons.js";
import { formatDuration } from "../../utils/time.js";

export function AudioPlayer({ src, postId }) {
  return `
    <div class="audio-player" data-audio-player="${postId}">
      <button class="audio-play-btn" data-play-btn="${postId}">
        ${icon("play", 24)}
      </button>
      <div class="audio-waveform" data-waveform="${postId}">
        <div class="audio-progress" style="width: 0%; height: 100%; background: var(--primary);"></div>
      </div>
      <span class="audio-time" data-time="${postId}">0:00</span>
      <audio src="${src}" data-audio="${postId}" preload="metadata"></audio>
    </div>
  `;
}

export function attachAudioPlayerEvents(container) {
  const players = container.querySelectorAll("[data-audio-player]");

  players.forEach((player) => {
    const postId = player.dataset.audioPlayer;
    const playBtn = player.querySelector(`[data-play-btn="${postId}"]`);
    const audio = player.querySelector(`[data-audio="${postId}"]`);
    const waveform = player.querySelector(`[data-waveform="${postId}"]`);
    const timeDisplay = player.querySelector(`[data-time="${postId}"]`);
    const progress = waveform.querySelector(".audio-progress");

    if (!playBtn || !audio) return;

    // Update duration when metadata loads
    audio.addEventListener("loadedmetadata", () => {
      const duration = audio.duration;
      if (isFinite(duration) && duration > 0) {
        timeDisplay.textContent = formatDuration(duration);
      } else {
        timeDisplay.textContent = "0:00";
      }
    });

    // Handle audio loading errors
    audio.addEventListener("error", (e) => {
      timeDisplay.textContent = "0:00";
      console.warn("Failed to load audio:", src);
    });

    // Play/pause toggle
    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        // Pause all other audio players
        document.querySelectorAll("audio").forEach((a) => {
          if (a !== audio) {
            a.pause();
            const otherPlayer = a.closest("[data-audio-player]");
            if (otherPlayer) {
              const otherBtn = otherPlayer.querySelector(".audio-play-btn");
              if (otherBtn) otherBtn.innerHTML = icon("play", 24);
            }
          }
        });

        audio.play();
        playBtn.innerHTML = icon("pause", 24);
      } else {
        audio.pause();
        playBtn.innerHTML = icon("play", 24);
      }
    });

    // Update progress
    audio.addEventListener("timeupdate", () => {
      const percent = (audio.currentTime / audio.duration) * 100;
      progress.style.width = `${percent}%`;
      timeDisplay.textContent = formatDuration(audio.currentTime);
    });

    // Reset when ended
    audio.addEventListener("ended", () => {
      playBtn.innerHTML = icon("play", 24);
      progress.style.width = "0%";
      timeDisplay.textContent = formatDuration(audio.duration);
    });

    // Seek on waveform click
    waveform.addEventListener("click", (e) => {
      const rect = waveform.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audio.currentTime = percent * audio.duration;
    });
  });
}
