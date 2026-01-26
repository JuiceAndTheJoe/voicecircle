// Audio recorder component

import { icon } from '../../utils/icons.js';
import { createMediaRecorder, requestMicrophoneAccess, stopMediaStream, formatRecordingTime } from '../../hooks/useMedia.js';

export function AudioRecorder() {
  return `
    <div class="audio-recorder" id="audioRecorder">
      <button class="record-btn" id="recordBtn">
        ${icon('mic', 32)}
      </button>
      <span class="record-time" id="recordTime">0:00</span>
      <span class="record-status" id="recordStatus">Tap to record</span>
    </div>
    <div id="audioPreview" style="display: none; margin-top: 1rem;"></div>
  `;
}

export function attachAudioRecorderEvents(container, onRecorded) {
  const recordBtn = container.querySelector('#recordBtn');
  const recordTime = container.querySelector('#recordTime');
  const recordStatus = container.querySelector('#recordStatus');
  const audioPreview = container.querySelector('#audioPreview');

  let stream = null;
  let mediaRecorder = null;
  let isRecording = false;
  let recordingInterval = null;
  let seconds = 0;
  let recordedBlob = null;

  recordBtn.addEventListener('click', async () => {
    if (isRecording) {
      // Stop recording
      stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  });

  async function startRecording() {
    const result = await requestMicrophoneAccess();
    if (result.error) {
      recordStatus.textContent = result.error;
      return;
    }

    stream = result.stream;
    mediaRecorder = createMediaRecorder(stream);

    isRecording = true;
    seconds = 0;
    recordBtn.classList.add('recording');
    recordBtn.innerHTML = icon('mic', 32);
    recordStatus.textContent = 'Recording...';

    mediaRecorder.start();

    recordingInterval = setInterval(() => {
      seconds++;
      recordTime.textContent = formatRecordingTime(seconds);

      // Max 60 seconds
      if (seconds >= 60) {
        stopRecording();
      }
    }, 1000);
  }

  async function stopRecording() {
    isRecording = false;
    recordBtn.classList.remove('recording');
    recordBtn.innerHTML = icon('mic', 32);
    recordStatus.textContent = 'Tap to record again';

    clearInterval(recordingInterval);

    if (mediaRecorder) {
      recordedBlob = await mediaRecorder.stop();
      showPreview(recordedBlob);

      if (onRecorded) {
        onRecorded(recordedBlob);
      }
    }

    stopMediaStream(stream);
    stream = null;
  }

  function showPreview(blob) {
    const url = URL.createObjectURL(blob);
    audioPreview.style.display = 'block';
    audioPreview.innerHTML = `
      <div class="audio-player" style="background: var(--bg-secondary);">
        <button class="audio-play-btn" id="previewPlayBtn">
          ${icon('play', 24)}
        </button>
        <audio id="previewAudio" src="${url}"></audio>
        <span class="audio-time">${formatRecordingTime(seconds)}</span>
        <button class="btn btn-secondary btn-sm" id="discardBtn" style="margin-left: auto;">Discard</button>
      </div>
    `;

    const playBtn = audioPreview.querySelector('#previewPlayBtn');
    const audio = audioPreview.querySelector('#previewAudio');
    const discardBtn = audioPreview.querySelector('#discardBtn');

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play();
        playBtn.innerHTML = icon('pause', 24);
      } else {
        audio.pause();
        playBtn.innerHTML = icon('play', 24);
      }
    });

    audio.addEventListener('ended', () => {
      playBtn.innerHTML = icon('play', 24);
    });

    discardBtn.addEventListener('click', () => {
      URL.revokeObjectURL(url);
      audioPreview.style.display = 'none';
      audioPreview.innerHTML = '';
      recordedBlob = null;
      seconds = 0;
      recordTime.textContent = '0:00';
      recordStatus.textContent = 'Tap to record';

      if (onRecorded) {
        onRecorded(null);
      }
    });
  }

  // Cleanup function
  return () => {
    if (stream) {
      stopMediaStream(stream);
    }
    if (recordingInterval) {
      clearInterval(recordingInterval);
    }
  };
}
