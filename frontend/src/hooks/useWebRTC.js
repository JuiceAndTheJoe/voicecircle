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
    this.apiKey = null; // API key for WHIP/WHEP authentication
    this.channelId = null; // Channel ID for WHEP (extracted from WHIP response)
    this.whepBaseUrl = null; // Base URL for WHEP gateway
  }

  async connect(signaling) {
    // Default ICE servers with STUN (TURN would need credentials)
    const iceServers = signaling?.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ];

    // Store API key for WHIP/WHEP authentication
    this.apiKey = signaling?.apiKey;

    // Store WHEP base URL for constructing subscriber endpoint
    this.whepBaseUrl = signaling?.whepBaseUrl;

    // If speaker/host, setup publishing via WHIP first
    // This creates the channel that subscribers will connect to
    if ((this.role === 'host' || this.role === 'speaker') && signaling?.whipEndpoint) {
      await this.setupPublisher(signaling.whipEndpoint, iceServers);

      // Report channel ID to backend so other participants can subscribe
      if (this.channelId) {
        await this.reportChannelId(this.channelId);
      }
    }

    // All participants subscribe via WHEP to receive audio
    // Need to get the channel ID first (either from our own publish or from backend)
    const channelId = this.channelId || signaling?.channelId;
    if (channelId && this.whepBaseUrl) {
      const whepEndpoint = `${this.whepBaseUrl}/whep/channel/${channelId}`;
      await this.setupSubscriber(whepEndpoint, iceServers);
    } else if (signaling?.channelId) {
      // Fallback: use channelId from signaling if provided
      const whepEndpoint = `${this.whepBaseUrl}/whep/channel/${signaling.channelId}`;
      await this.setupSubscriber(whepEndpoint, iceServers);
    } else {
      console.log('No channel ID available yet - waiting for host to publish');
    }

    return true;
  }

  async reportChannelId(channelId) {
    try {
      const token = localStorage.getItem('voicecircle_token');
      const response = await fetch(`/api/rooms/${this.roomId}/channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ channelId })
      });
      if (response.ok) {
        console.log('Reported channel ID to backend:', channelId);
      } else {
        console.warn('Failed to report channel ID:', response.status);
      }
    } catch (error) {
      console.warn('Failed to report channel ID:', error);
    }
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
    const headers = {
      'Content-Type': 'application/sdp'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(whipEndpoint, {
      method: 'POST',
      headers,
      body: completeOffer.sdp
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`WHIP publish failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Log all response headers for debugging
    console.log('WHIP response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    // Store resource URL for later cleanup
    this.whipResourceUrl = response.headers.get('Location') || whipEndpoint;
    console.log('WHIP resource URL:', this.whipResourceUrl);

    // Extract channel ID from Location header
    // Format: /api/v2/whip/sfu-broadcaster/{channelId}
    const locationParts = this.whipResourceUrl.split('/');
    this.channelId = locationParts[locationParts.length - 1];
    console.log('Extracted channel ID:', this.channelId);

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
    // Eyevinn WHEP uses server-side offer pattern:
    // 1. POST empty body to get server's SDP offer
    // 2. PATCH our SDP answer to the resource URL

    // Step 1: POST empty body to get server's offer
    const headers = {
      'Content-Type': 'application/sdp'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(whepEndpoint, {
      method: 'POST',
      headers,
      body: '' // Empty body - server generates the offer
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`WHEP subscribe failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Store resource URL for cleanup and for sending answer
    this.whepResourceUrl = response.headers.get('Location');
    console.log('WHEP resource URL:', this.whepResourceUrl);

    // Get SDP offer from server
    const offerSdp = await response.text();
    console.log('Received WHEP offer from server');

    // Set server's offer as remote description
    const offer = new RTCSessionDescription({
      type: 'offer',
      sdp: offerSdp
    });
    await this.subscriberPc.setRemoteDescription(offer);

    // Create our answer
    const answer = await this.subscriberPc.createAnswer();
    await this.subscriberPc.setLocalDescription(answer);

    // Wait for ICE gathering
    await this.waitForIceGathering(this.subscriberPc);

    const completeAnswer = this.subscriberPc.localDescription;

    // Step 2: PATCH our answer to the resource URL
    const patchHeaders = {
      'Content-Type': 'application/sdp'
    };
    if (this.apiKey) {
      patchHeaders['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Resource URL might be relative, construct full URL
    const resourceUrl = this.whepResourceUrl.startsWith('/')
      ? new URL(this.whepResourceUrl, whepEndpoint).href
      : this.whepResourceUrl;

    const patchResponse = await fetch(resourceUrl, {
      method: 'PATCH',
      headers: patchHeaders,
      body: completeAnswer.sdp
    });

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text().catch(() => '');
      throw new Error(`WHEP answer failed: ${patchResponse.status} ${patchResponse.statusText} - ${errorText}`);
    }

    console.log('WHEP answer sent successfully');
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
