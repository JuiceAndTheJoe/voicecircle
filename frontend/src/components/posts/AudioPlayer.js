// Audio playback component

import { icon } from "../../utils/icons.js";
import { formatDuration } from "../../utils/time.js";

export function AudioPlayer({ src, postId, duration }) {
  const initialTime = duration ? formatDuration(duration) : "0:00";
  return `
    <div class="audio-player" data-audio-player="${postId}" data-duration="${duration || 0}">
      <button class="audio-play-btn" data-play-btn="${postId}">
        ${icon("play", 24)}
      </button>
      <div class="audio-waveform" data-waveform="${postId}">
        <div class="audio-progress" style="width: 0%; height: 100%; background: var(--primary);"></div>
      </div>
      <span class="audio-time" data-time="${postId}">${initialTime}</span>
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

    // Get duration from data attribute (stored when post was created)
    const storedDuration = parseFloat(player.dataset.duration) || 0;
    let totalDuration = storedDuration;
    let isPlaying = false;

    const updateDurationDisplay = () => {
      const duration = audio.duration;
      if (isFinite(duration) && duration > 0) {
        totalDuration = duration;
        if (!isPlaying) {
          timeDisplay.textContent = formatDuration(duration);
        }
      }
    };

    // Update duration when metadata loads (fallback if stored duration unavailable)
    audio.addEventListener("loadedmetadata", updateDurationDisplay);
    audio.addEventListener("durationchange", updateDurationDisplay);
    audio.addEventListener("canplay", updateDurationDisplay);

    // Handle audio loading errors
    audio.addEventListener("error", (e) => {
      timeDisplay.textContent = "0:00";
      console.warn("Failed to load audio:", audio.src);
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

        isPlaying = true;
        audio.play();
        playBtn.innerHTML = icon("pause", 24);
      } else {
        isPlaying = false;
        audio.pause();
        playBtn.innerHTML = icon("play", 24);
        // Show total duration when paused
        if (totalDuration > 0) {
          timeDisplay.textContent = formatDuration(totalDuration);
        }
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
      isPlaying = false;
      playBtn.innerHTML = icon("play", 24);
      progress.style.width = "0%";
      timeDisplay.textContent = formatDuration(totalDuration || audio.duration);
    });

    // Seek on waveform click
    waveform.addEventListener("click", (e) => {
      const rect = waveform.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audio.currentTime = percent * audio.duration;
    });
  });
}
