// Media recording utilities

export function createMediaRecorder(stream, mimeType = 'audio/webm') {
  const options = { mimeType };
  let chunks = [];
  let recorder;

  try {
    recorder = new MediaRecorder(stream, options);
  } catch (e) {
    // Fallback for browsers that don't support webm
    recorder = new MediaRecorder(stream);
  }

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return {
    recorder,
    start: () => {
      chunks = [];
      recorder.start(100); // Collect data every 100ms
    },
    stop: () => {
      return new Promise((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          resolve(blob);
        };
        recorder.stop();
      });
    },
    getChunks: () => chunks
  };
}

export async function requestMicrophoneAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return { stream, error: null };
  } catch (error) {
    let message = 'Could not access microphone';
    if (error.name === 'NotAllowedError') {
      message = 'Microphone access was denied. Please allow microphone access in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      message = 'No microphone found. Please connect a microphone and try again.';
    }
    return { stream: null, error: message };
  }
}

export function stopMediaStream(stream) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

export function formatRecordingTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
