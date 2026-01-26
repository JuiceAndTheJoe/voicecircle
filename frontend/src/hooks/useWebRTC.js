// WebRTC WHIP/WHEP handling for live rooms

export class RoomConnection {
  constructor(roomId, userId, role) {
    this.roomId = roomId;
    this.userId = userId;
    this.role = role;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStreams = new Map();
    this.isMuted = true;
    this.onParticipantUpdate = null;
    this.onSpeakingChange = null;
  }

  async connect(signaling) {
    // Create peer connection with ICE servers
    const config = {
      iceServers: signaling?.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(config);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send candidate to signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        this.remoteStreams.set(stream.id, stream);
        if (this.onParticipantUpdate) {
          this.onParticipantUpdate();
        }
      }
    };

    // If speaker/host, get local audio
    if (this.role === 'host' || this.role === 'speaker') {
      await this.setupLocalAudio();
    }

    return true;
  }

  async setupLocalAudio() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Mute by default
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream);
      });

      // Setup audio level detection
      this.setupAudioLevelDetection();

      return true;
    } catch (error) {
      console.error('Failed to get local audio:', error);
      return false;
    }
  }

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

  toggleMute() {
    if (!this.localStream) return false;

    this.isMuted = !this.isMuted;

    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMuted;
    });

    return this.isMuted;
  }

  setMuted(muted) {
    if (!this.localStream) return;

    this.isMuted = muted;

    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }

  disconnect() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear remote streams
    this.remoteStreams.clear();
  }
}

export function createRoomConnection(roomId, userId, role) {
  return new RoomConnection(roomId, userId, role);
}
