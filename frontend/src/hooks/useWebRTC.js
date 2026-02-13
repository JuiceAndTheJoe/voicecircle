// WebRTC handling for live rooms - Direct SMB integration
// Audio-only with Push-to-Talk (PTT) like YourVoice

// PTT Configuration
const PTT_MIN_HOLD_MS = 300; // Minimum hold duration before audio transmits

export class RoomConnection {
  constructor(roomId, userId, role) {
    this.roomId = roomId;
    this.userId = userId;
    this.role = role;
    this.pc = null; // Single peer connection for both send/receive
    this.localStream = null;
    this.remoteStreams = new Map();
    this.isMuted = true; // Audio always starts muted (PTT)
    this.isTalking = false; // PTT state
    this.pttTimeout = null; // For 300ms minimum hold
    this.onParticipantUpdate = null;
    this.onSpeakingChange = null;
    this.onTalkingStateChange = null; // Callback for PTT UI updates
    this.audioElements = new Map();
    this.heartbeatInterval = null;
    this.sessionId = null;
    this.audioContext = null;
    this.analyser = null;
  }

  /**
   * Connect to the room using direct SMB integration
   * @param {object} signaling - Signaling data from join response
   * @param {string} signaling.sdp - SDP offer from server
   * @param {array} signaling.iceServers - ICE servers for RTCPeerConnection
   * @param {string} signaling.sessionId - Session identifier
   */
  async connect(signaling) {
    console.log('[CONNECT] Starting audio-only connection with PTT');

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

    // Get local audio for speakers/hosts (audio only, no video)
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

    console.log('[CONNECT] Audio connection established successfully');
    return true;
  }

  /**
   * Setup local media (audio only - no video)
   */
  async setupLocalMedia() {
    try {
      // Request audio only - no video
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Audio starts DISABLED (muted) - PTT requires user to hold button
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      this.isMuted = true;

      // Add local audio track to peer connection
      this.localStream.getTracks().forEach((track) => {
        console.log('[MEDIA] Adding local track:', track.kind);
        this.pc.addTrack(track, this.localStream);
      });

      // Setup audio level detection for speaking indicator
      this.setupAudioLevelDetection();

      console.log('[MEDIA] Audio-only media setup complete (PTT mode)');
    } catch (error) {
      console.error('[MEDIA] Failed to get user media:', error);
      throw error;
    }
  }

  /**
   * Handle incoming remote tracks (audio only)
   */
  handleRemoteTrack(event) {
    const track = event.track;
    const stream = event.streams[0];

    if (track.kind === 'audio') {
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

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.localStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    source.connect(this.analyser);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!this.localStream) return;

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

      // Only show speaking indicator when PTT is active and there's audio
      const isSpeaking = average > 30 && this.isTalking;

      if (this.onSpeakingChange) {
        this.onSpeakingChange(this.userId, isSpeaking);
      }

      requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  // ============================================================
  // Push-to-Talk (PTT) Methods
  // ============================================================

  /**
   * Start PTT - called on pointer/touch down or key down
   * Uses 300ms delay like YourVoice to prevent accidental taps
   */
  startPTT() {
    if (!this.localStream || this.isTalking) return;

    // Clear any existing timeout
    if (this.pttTimeout) {
      clearTimeout(this.pttTimeout);
    }

    // Start 300ms timer before actually enabling audio
    this.pttTimeout = setTimeout(() => {
      this.enableAudio();
    }, PTT_MIN_HOLD_MS);

    console.log('[PTT] Starting (300ms hold required)');
  }

  /**
   * Stop PTT - called on pointer/touch up or key up
   */
  stopPTT() {
    // Clear the timeout if released before 300ms
    if (this.pttTimeout) {
      clearTimeout(this.pttTimeout);
      this.pttTimeout = null;
    }

    // Disable audio if it was enabled
    if (this.isTalking) {
      this.disableAudio();
    }

    console.log('[PTT] Stopped');
  }

  /**
   * Enable audio transmission (internal - called after 300ms hold)
   */
  enableAudio() {
    if (!this.localStream) return;

    this.isTalking = true;
    this.isMuted = false;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });

    // Notify UI of state change
    if (this.onTalkingStateChange) {
      this.onTalkingStateChange(true);
    }

    console.log('[PTT] Audio ENABLED - transmitting');
  }

  /**
   * Disable audio transmission
   */
  disableAudio() {
    if (!this.localStream) return;

    this.isTalking = false;
    this.isMuted = true;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });

    // Notify UI of state change
    if (this.onTalkingStateChange) {
      this.onTalkingStateChange(false);
    }

    console.log('[PTT] Audio DISABLED');
  }

  /**
   * Get current PTT/talking state
   */
  getTalkingState() {
    return this.isTalking;
  }

  /**
   * Legacy mute methods (for compatibility) - now just wraps PTT
   */
  toggleMute() {
    // In PTT mode, this doesn't make sense - use startPTT/stopPTT instead
    console.warn('[MUTE] Use PTT controls instead of toggleMute in PTT mode');
    return this.isMuted;
  }

  setMuted(muted) {
    // In PTT mode, mute is controlled by PTT button
    if (muted) {
      this.disableAudio();
    } else {
      this.enableAudio();
    }
  }

  /**
   * Disconnect from the room
   */
  async disconnect() {
    console.log('[DISCONNECT] Cleaning up connection');

    // Stop PTT if active
    this.stopPTT();

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
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

    console.log('[DISCONNECT] Cleanup complete');
  }
}

/**
 * Create a new room connection (audio-only PTT)
 */
export function createRoomConnection(roomId, userId, role) {
  return new RoomConnection(roomId, userId, role);
}
