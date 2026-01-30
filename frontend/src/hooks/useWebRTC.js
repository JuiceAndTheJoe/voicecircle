// WebRTC WHIP/WHEP handling for live rooms

export class RoomConnection {
  constructor(roomId, userId, role) {
    this.roomId = roomId;
    this.userId = userId;
    this.role = role;
    this.publisherPc = null;  // For WHIP (sending audio)
    this.subscriberPc = null; // For WHEP (receiving audio)
    this.localStream = null;
    this.remoteStreams = new Map();
    this.isMuted = true;
    this.onParticipantUpdate = null;
    this.onSpeakingChange = null;
    this.whipResourceUrl = null;
    this.whepResourceUrl = null;
    this.audioElements = new Map(); // Track audio elements for remote streams
  }

  async connect(signaling) {
    const iceServers = signaling?.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' }
    ];

    // If speaker/host, setup publishing via WHIP
    if ((this.role === 'host' || this.role === 'speaker') && signaling?.whipEndpoint) {
      await this.setupPublisher(signaling.whipEndpoint, iceServers);
    }

    // All participants subscribe via WHEP to receive audio
    if (signaling?.whepEndpoint) {
      await this.setupSubscriber(signaling.whepEndpoint, iceServers);
    }

    return true;
  }

  async setupPublisher(whipEndpoint, iceServers) {
    try {
      // Get local audio
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Mute by default
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });

      // Create publisher peer connection
      this.publisherPc = new RTCPeerConnection({ iceServers });

      // Add local tracks
      this.localStream.getTracks().forEach(track => {
        this.publisherPc.addTrack(track, this.localStream);
      });

      // Setup audio level detection for speaking indicator
      this.setupAudioLevelDetection();

      // Wait for ICE gathering to complete, then send offer via WHIP
      await this.publishViaWhip(whipEndpoint);

      console.log('WHIP publisher connected');
    } catch (error) {
      console.error('Failed to setup publisher:', error);
    }
  }

  async publishViaWhip(whipEndpoint) {
    // Create offer
    const offer = await this.publisherPc.createOffer();
    await this.publisherPc.setLocalDescription(offer);

    // Wait for ICE gathering to complete
    await this.waitForIceGathering(this.publisherPc);

    // Get the complete offer with ICE candidates
    const completeOffer = this.publisherPc.localDescription;

    // POST offer to WHIP endpoint
    const response = await fetch(whipEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: completeOffer.sdp
    });

    if (!response.ok) {
      throw new Error(`WHIP publish failed: ${response.status} ${response.statusText}`);
    }

    // Store resource URL for later cleanup
    this.whipResourceUrl = response.headers.get('Location') || whipEndpoint;

    // Get SDP answer
    const answerSdp = await response.text();
    const answer = new RTCSessionDescription({
      type: 'answer',
      sdp: answerSdp
    });

    await this.publisherPc.setRemoteDescription(answer);
  }

  async setupSubscriber(whepEndpoint, iceServers) {
    try {
      // Create subscriber peer connection
      this.subscriberPc = new RTCPeerConnection({ iceServers });

      // Handle incoming tracks
      this.subscriberPc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        const stream = event.streams[0];
        if (stream && !this.remoteStreams.has(stream.id)) {
          this.remoteStreams.set(stream.id, stream);
          this.playRemoteAudio(stream);
          if (this.onParticipantUpdate) {
            this.onParticipantUpdate();
          }
        }
      };

      // Subscribe via WHEP
      await this.subscribeViaWhep(whepEndpoint);

      console.log('WHEP subscriber connected');
    } catch (error) {
      console.error('Failed to setup subscriber:', error);
    }
  }

  async subscribeViaWhep(whepEndpoint) {
    // For WHEP, we need to add a recvonly transceiver first
    this.subscriberPc.addTransceiver('audio', { direction: 'recvonly' });

    // Create offer
    const offer = await this.subscriberPc.createOffer();
    await this.subscriberPc.setLocalDescription(offer);

    // Wait for ICE gathering
    await this.waitForIceGathering(this.subscriberPc);

    const completeOffer = this.subscriberPc.localDescription;

    // POST offer to WHEP endpoint
    const response = await fetch(whepEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: completeOffer.sdp
    });

    if (!response.ok) {
      throw new Error(`WHEP subscribe failed: ${response.status} ${response.statusText}`);
    }

    // Store resource URL for cleanup
    this.whepResourceUrl = response.headers.get('Location') || whepEndpoint;

    // Get SDP answer
    const answerSdp = await response.text();
    const answer = new RTCSessionDescription({
      type: 'answer',
      sdp: answerSdp
    });

    await this.subscriberPc.setRemoteDescription(answer);
  }

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

  playRemoteAudio(stream) {
    // Create an audio element to play the remote stream
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.playsInline = true;

    // Some browsers require the element to be in the DOM
    audio.style.display = 'none';
    document.body.appendChild(audio);

    // Store reference for cleanup
    this.audioElements.set(stream.id, audio);

    // Handle autoplay restrictions
    audio.play().catch(err => {
      console.warn('Autoplay blocked, will play on user interaction:', err);
      // Add a one-time click handler to start playback
      const startPlayback = () => {
        audio.play();
        document.removeEventListener('click', startPlayback);
      };
      document.addEventListener('click', startPlayback);
    });

    console.log('Playing remote audio stream:', stream.id);
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

  async disconnect() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Remove audio elements
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    });
    this.audioElements.clear();

    // Close publisher connection and cleanup WHIP resource
    if (this.publisherPc) {
      this.publisherPc.close();
      this.publisherPc = null;
    }
    if (this.whipResourceUrl) {
      try {
        await fetch(this.whipResourceUrl, { method: 'DELETE' });
      } catch (e) {
        console.warn('Failed to cleanup WHIP resource:', e);
      }
      this.whipResourceUrl = null;
    }

    // Close subscriber connection and cleanup WHEP resource
    if (this.subscriberPc) {
      this.subscriberPc.close();
      this.subscriberPc = null;
    }
    if (this.whepResourceUrl) {
      try {
        await fetch(this.whepResourceUrl, { method: 'DELETE' });
      } catch (e) {
        console.warn('Failed to cleanup WHEP resource:', e);
      }
      this.whepResourceUrl = null;
    }

    // Clear remote streams
    this.remoteStreams.clear();
  }
}

export function createRoomConnection(roomId, userId, role) {
  return new RoomConnection(roomId, userId, role);
}
