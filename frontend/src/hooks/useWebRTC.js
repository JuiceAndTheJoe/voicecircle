// WebRTC handling for live rooms - Direct SMB integration
// Replaces WHIP/WHEP bridges with direct SDP exchange

// Video quality presets
const VIDEO_QUALITY = {
  '480p':  { width: 854,  height: 480,  frameRate: 30 },
  '720p':  { width: 1280, height: 720,  frameRate: 30 },
  '1080p': { width: 1920, height: 1080, frameRate: 30 }
};

export class RoomConnection {
  constructor(roomId, userId, role, videoQuality = '720p') {
    this.roomId = roomId;
    this.userId = userId;
    this.role = role;
    this.videoQuality = videoQuality;
    this.pc = null; // Single peer connection for both send/receive
    this.localStream = null;
    this.remoteStreams = new Map();
    this.remoteVideoStream = null;
    this.isMuted = true;
    this.isVideoEnabled = true;
    this.onParticipantUpdate = null;
    this.onSpeakingChange = null;
    this.onVideoTrack = null;
    this.audioElements = new Map();
    this.heartbeatInterval = null;
    this.sessionId = null;
  }

  /**
   * Connect to the room using direct SMB integration
   * @param {object} signaling - Signaling data from join response
   * @param {string} signaling.sdp - SDP offer from server
   * @param {array} signaling.iceServers - ICE servers for RTCPeerConnection
   * @param {string} signaling.sessionId - Session identifier
   * @param {string} signaling.videoQuality - Video quality setting
   */
  async connect(signaling) {
    console.log('[CONNECT] Starting connection with direct SMB integration');

    // Get video quality from signaling if provided
    if (signaling?.videoQuality) {
      this.videoQuality = signaling.videoQuality;
    }

    // Store session ID
    this.sessionId = signaling?.sessionId;

    // Get ICE servers
    const iceServers = signaling?.iceServers || [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    console.log('[CONNECT] Using ICE servers:', iceServers.map(s => s.urls));

    // Create single peer connection
    this.pc = new RTCPeerConnection({ iceServers });

    // Handle incoming tracks (audio from other participants)
    this.pc.ontrack = (event) => {
      console.log('[TRACK] Received remote track:', event.track.kind);
      this.handleRemoteTrack(event);
    };

    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      console.log('[CONNECTION] State changed:', this.pc.connectionState);
      if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'disconnected') {
        console.warn('[CONNECTION] Connection lost');
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('[ICE] Connection state:', this.pc.iceConnectionState);
    };

    // Get local media for speakers/hosts
    if (this.role === 'host' || this.role === 'speaker') {
      await this.setupLocalMedia();
    }

    // Set server's SDP offer as remote description
    if (!signaling?.sdp) {
      throw new Error('No SDP offer received from server');
    }

    console.log('[SDP] Setting remote description (server offer)');
    await this.pc.setRemoteDescription({
      type: 'offer',
      sdp: signaling.sdp
    });

    // Create local SDP answer
    console.log('[SDP] Creating answer');
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    // Wait for ICE gathering to complete
    console.log('[ICE] Waiting for gathering to complete');
    await this.waitForIceGathering(this.pc);

    // Get complete answer with ICE candidates
    const completeAnswer = this.pc.localDescription;

    // Send answer to backend
    console.log('[SDP] Submitting answer to backend');
    await this.submitAnswer(completeAnswer.sdp);

    // Start heartbeat to keep session alive
    this.startHeartbeat();

    console.log('[CONNECT] Connection established successfully');
    return true;
  }

  /**
   * Setup local media (audio and optionally video)
   */
  async setupLocalMedia() {
    try {
      const constraints = VIDEO_QUALITY[this.videoQuality] || VIDEO_QUALITY['720p'];

      // Request audio and video
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: constraints.width },
          height: { ideal: constraints.height },
          frameRate: { ideal: constraints.frameRate }
        }
      });

      // Mute audio by default
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });

      // Video is enabled by default
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = this.isVideoEnabled;
      });

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        console.log('[MEDIA] Adding local track:', track.kind);
        this.pc.addTrack(track, this.localStream);
      });

      // Setup audio level detection for speaking indicator
      this.setupAudioLevelDetection();

      console.log('[MEDIA] Local media setup complete');
    } catch (error) {
      console.error('[MEDIA] Failed to get user media:', error);
      throw error;
    }
  }

  /**
   * Handle incoming remote tracks
   */
  handleRemoteTrack(event) {
    const track = event.track;
    const stream = event.streams[0];

    if (track.kind === 'video') {
      this.remoteVideoStream = stream;
      if (this.onVideoTrack) {
        this.onVideoTrack(stream);
      }
    } else if (track.kind === 'audio') {
      if (stream && !this.remoteStreams.has(stream.id)) {
        this.remoteStreams.set(stream.id, stream);
        this.playRemoteAudio(stream);
      }
    }

    if (this.onParticipantUpdate) {
      this.onParticipantUpdate();
    }
  }

  /**
   * Submit SDP answer to backend
   */
  async submitAnswer(sdpAnswer) {
    const token = localStorage.getItem('voicecircle_token');
    const response = await fetch(`/api/rooms/${this.roomId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sdpAnswer })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to submit answer: ${response.status} - ${error.error || ''}`);
    }

    console.log('[ANSWER] Successfully submitted to backend');
  }

  /**
   * Start heartbeat to keep session alive
   */
  startHeartbeat() {
    // Clear any existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send heartbeat every 10 seconds
    this.heartbeatInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('voicecircle_token');
        const response = await fetch(`/api/rooms/${this.roomId}/heartbeat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.warn('[HEARTBEAT] Failed:', response.status);
        }
      } catch (err) {
        console.error('[HEARTBEAT] Error:', err);
      }
    }, 10000);

    console.log('[HEARTBEAT] Started');
  }

  /**
   * Wait for ICE gathering to complete
   */
  waitForIceGathering(pc) {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };

      pc.addEventListener('icegatheringstatechange', checkState);

      // Timeout fallback after 5 seconds
      setTimeout(() => {
        pc.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }, 5000);
    });
  }

  /**
   * Play remote audio stream
   */
  playRemoteAudio(stream) {
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.playsInline = true;
    audio.style.display = 'none';
    document.body.appendChild(audio);

    this.audioElements.set(stream.id, audio);

    audio.play().catch((err) => {
      console.warn('[AUDIO] Autoplay blocked, will play on user interaction:', err);
      const startPlayback = () => {
        audio.play();
        document.removeEventListener('click', startPlayback);
      };
      document.addEventListener('click', startPlayback);
    });

    console.log('[AUDIO] Playing remote stream:', stream.id);
  }

  /**
   * Setup audio level detection for speaking indicator
   */
  setupAudioLevelDetection() {
    if (!this.localStream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(this.localStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!this.localStream) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const isSpeaking = average > 30 && !this.isMuted;

      if (this.onSpeakingChange) {
        this.onSpeakingChange(this.userId, isSpeaking);
      }

      requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  /**
   * Toggle audio mute
   */
  toggleMute() {
    if (!this.localStream) return false;

    this.isMuted = !this.isMuted;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });

    return this.isMuted;
  }

  /**
   * Set mute state
   */
  setMuted(muted) {
    if (!this.localStream) return;

    this.isMuted = muted;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  /**
   * Toggle camera
   */
  toggleCamera() {
    if (!this.localStream) return false;

    this.isVideoEnabled = !this.isVideoEnabled;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = this.isVideoEnabled;
    });
    return this.isVideoEnabled;
  }

  /**
   * Set video enabled state
   */
  setVideoEnabled(enabled) {
    if (!this.localStream) return;

    this.isVideoEnabled = enabled;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  /**
   * Get local video stream
   */
  getLocalVideoStream() {
    return this.localStream;
  }

  /**
   * Get remote video stream
   */
  getRemoteVideoStream() {
    return this.remoteVideoStream;
  }

  /**
   * Disconnect from the room
   */
  async disconnect() {
    console.log('[DISCONNECT] Cleaning up connection');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Remove audio elements
    this.audioElements.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    });
    this.audioElements.clear();

    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // Clear remote streams
    this.remoteStreams.clear();
    this.remoteVideoStream = null;

    console.log('[DISCONNECT] Cleanup complete');
  }
}

/**
 * Create a new room connection
 */
export function createRoomConnection(roomId, userId, role, videoQuality = '720p') {
  return new RoomConnection(roomId, userId, role, videoQuality);
}
