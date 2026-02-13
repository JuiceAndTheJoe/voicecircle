// Connection Service - SDP generation for direct SMB integration
// Ported from YourVoice backend (yourvoice-backend/src/connection.ts)

import { write, parse } from 'sdp-transform';
import { v4 as uuidv4 } from 'uuid';

/**
 * Connection class for building SDP offers from SMB endpoint descriptions
 */
export class Connection {
  constructor(endpointId, mediaStreams, endpointDescription) {
    this.endpointId = endpointId;
    this.mediaStreams = mediaStreams;
    this.endpointDescription = endpointDescription;
    this.nextMid = 0;
    this.usedMids = [];
  }

  /**
   * Create an SDP offer from the SMB endpoint description
   * @returns {object} SessionDescription object
   */
  createOffer() {
    const offer = {
      version: 0,
      origin: {
        username: '-',
        sessionId: '2438602337097565327',
        sessionVersion: 2,
        netType: 'IN',
        ipVer: 4,
        address: '127.0.0.1'
      },
      name: '-',
      timing: {
        start: 0,
        stop: 0
      },
      media: []
    };

    // Add data channel (SFU control)
    this.addDataChannelMid(offer);

    // Add audio media descriptions
    this.addAudioMids(offer);

    // Build msid semantic
    let msidSemanticToken = 'feedbackvideomslabel';
    if (this.mediaStreams && this.mediaStreams.audio.ssrcs.length !== 0) {
      const mslabels = this.mediaStreams.audio.ssrcs.map(s => s.mslabel);
      msidSemanticToken = mslabels.join(' ');
    }

    offer.msidSemantic = {
      semantic: 'WMS',
      token: msidSemanticToken
    };

    // Bundle all media
    offer.groups = [
      {
        type: 'BUNDLE',
        mids: this.usedMids.join(' ')
      }
    ];

    return offer;
  }

  /**
   * Create a base media description with ICE/DTLS from endpoint
   */
  makeMediaDescription(type) {
    if (!this.endpointDescription) {
      throw new Error('Missing endpointDescription');
    }
    if (!this.endpointDescription['bundle-transport']) {
      throw new Error('Missing bundle-transport in endpointDescription');
    }

    const transport = this.endpointDescription['bundle-transport'];

    if (!transport.ice) {
      throw new Error('Missing ice in endpointDescription');
    }
    if (!transport.dtls) {
      throw new Error('Missing dtls in endpointDescription');
    }

    const result = {
      mid: this.nextMid.toString(),
      type: type,
      port: 9,
      protocol: 'RTP/SAVPF',
      payloads: '',
      rtp: [],
      fmtp: [],
      rtcpFb: [],
      rtcp: {
        port: 9,
        netType: 'IN',
        ipVer: 4,
        address: '0.0.0.0'
      },
      ext: [],
      ssrcs: [],
      ssrcGroups: [],
      iceUfrag: transport.ice.ufrag,
      icePwd: transport.ice.pwd,
      fingerprint: {
        type: transport.dtls.type,
        hash: transport.dtls.hash
      },
      setup: transport.dtls.setup === 'actpass' ? 'active' : 'actpass',
      direction: 'sendrecv',
      rtcpMux: 'rtcp-mux',
      connection: {
        version: 4,
        ip: '0.0.0.0'
      },
      candidates: transport.ice.candidates.map(c => ({
        foundation: c.foundation,
        component: c.component,
        transport: c.protocol,
        priority: c.priority,
        ip: c.ip,
        port: c.port,
        type: c.type,
        raddr: c['rel-addr'],
        rport: c['rel-port'],
        generation: c.generation || 0,
        'network-id': c.network
      }))
    };

    this.usedMids.push(this.nextMid.toString());
    this.nextMid++;
    return result;
  }

  /**
   * Add data channel media description (for SFU signaling)
   */
  addDataChannelMid(offer) {
    const dataDescription = this.makeMediaDescription('application');
    dataDescription.protocol = 'UDP/DTLS/SCTP';
    dataDescription.payloads = 'webrtc-datachannel';
    dataDescription.sctpPort = this.endpointDescription?.data?.port;
    dataDescription.maxMessageSize = 262144;
    offer.media.push(dataDescription);
  }

  /**
   * Add audio media descriptions for each SSRC
   */
  addAudioMids(offer) {
    if (!this.endpointDescription) {
      throw new Error('Missing endpointDescription');
    }
    if (!this.endpointDescription.audio) {
      throw new Error('Missing audio in endpointDescription');
    }
    if (!this.mediaStreams) {
      throw new Error('Missing mediaStreams');
    }

    const audio = this.endpointDescription.audio;
    const audioPayloadType = audio['payload-type'];

    for (const ssrcInfo of this.mediaStreams.audio.ssrcs) {
      const audioDescription = this.makeMediaDescription('audio');
      audioDescription.payloads = audioPayloadType.id.toString();
      audioDescription.rtp = [
        {
          payload: audioPayloadType.id,
          codec: audioPayloadType.name,
          rate: audioPayloadType.clockrate,
          encoding: audioPayloadType.channels
        }
      ];

      // Add fmtp parameters if present
      const parameters = audioPayloadType.parameters || {};
      const paramKeys = Object.keys(parameters);
      if (paramKeys.length !== 0) {
        audioDescription.fmtp = [
          {
            payload: audioPayloadType.id,
            config: paramKeys.map(key => `${key}=${parameters[key]}`).join(';')
          }
        ];
      }

      // Add RTP header extensions
      audioDescription.ext = (audio['rtp-hdrexts'] || []).map(ext => ({
        value: ext.id,
        uri: ext.uri
      }));

      // Add SSRC attributes
      audioDescription.ssrcs.push({
        id: parseInt(ssrcInfo.ssrc),
        attribute: 'cname',
        value: ssrcInfo.cname
      });
      audioDescription.ssrcs.push({
        id: parseInt(ssrcInfo.ssrc),
        attribute: 'label',
        value: ssrcInfo.label
      });
      audioDescription.ssrcs.push({
        id: parseInt(ssrcInfo.ssrc),
        attribute: 'mslabel',
        value: ssrcInfo.mslabel
      });
      audioDescription.ssrcs.push({
        id: parseInt(ssrcInfo.ssrc),
        attribute: 'msid',
        value: `${ssrcInfo.mslabel} ${ssrcInfo.label}`
      });

      offer.media.push(audioDescription);
    }
  }
}

/**
 * Create an SDP offer from SMB endpoint description
 * @param {object} endpointDescription - SMB endpoint description from allocateEndpoint
 * @param {string} endpointId - Unique endpoint identifier
 * @returns {string} SDP offer string
 */
export function createSdpOffer(endpointDescription, endpointId) {
  if (!endpointDescription.audio) {
    throw new Error('Missing audio in endpoint description');
  }

  // Build media streams info with unique SSRCs
  const ssrcs = endpointDescription.audio.ssrcs.map(ssrcNr => ({
    ssrc: ssrcNr.toString(),
    cname: uuidv4(),
    mslabel: uuidv4(),
    label: uuidv4()
  }));

  const mediaStreams = {
    audio: { ssrcs }
  };

  const connection = new Connection(endpointId, mediaStreams, endpointDescription);
  const offer = connection.createOffer();
  return write(offer);
}

/**
 * Parse SDP answer to extract ICE/DTLS parameters for SMB configuration
 * @param {string} sdpAnswer - SDP answer string from client
 * @param {object} endpointDescription - Original endpoint description from allocateEndpoint
 * @returns {object} Updated endpoint description for configureEndpoint
 */
export function parseAnswerForConfiguration(sdpAnswer, endpointDescription) {
  const parsedAnswer = parse(sdpAnswer);

  // Deep clone the endpoint description
  const configuredEndpoint = JSON.parse(JSON.stringify(endpointDescription));

  const transport = configuredEndpoint['bundle-transport'];
  if (!transport) {
    throw new Error('Missing bundle-transport in endpoint description');
  }
  if (!transport.dtls) {
    throw new Error('Missing dtls in endpoint description');
  }
  if (!transport.ice) {
    throw new Error('Missing ice in endpoint description');
  }

  // Find the first audio media description in the answer
  const audioMedia = parsedAnswer.media.find(m => m.type === 'audio');
  if (!audioMedia) {
    throw new Error('Missing audio media in SDP answer');
  }

  // Extract fingerprint (can be at session or media level)
  const fingerprint = parsedAnswer.fingerprint || audioMedia.fingerprint;
  if (!fingerprint) {
    throw new Error('Missing fingerprint in SDP answer');
  }

  // Update DTLS parameters
  transport.dtls.type = fingerprint.type;
  transport.dtls.hash = fingerprint.hash;
  transport.dtls.setup = audioMedia.setup || 'active';

  // Update ICE parameters
  transport.ice.ufrag = String(audioMedia.iceUfrag || parsedAnswer.iceUfrag || '');
  transport.ice.pwd = audioMedia.icePwd || parsedAnswer.icePwd || '';

  // Extract ICE candidates from answer
  transport.ice.candidates = (audioMedia.candidates || []).map(c => ({
    generation: c.generation || 0,
    component: c.component,
    protocol: c.transport.toLowerCase(),
    port: c.port,
    ip: c.ip,
    'rel-port': c.rport,
    'rel-addr': c.raddr,
    foundation: String(c.foundation),
    priority: parseInt(String(c.priority), 10),
    type: c.type,
    network: c['network-id']
  }));

  // Extract audio SSRCs from answer
  configuredEndpoint.audio.ssrcs = [];
  if (audioMedia.ssrcs) {
    const uniqueSsrcs = new Set();
    audioMedia.ssrcs
      .filter(s => s.attribute === 'msid')
      .forEach(s => {
        const ssrcId = parseInt(String(s.id), 10);
        if (!uniqueSsrcs.has(ssrcId)) {
          uniqueSsrcs.add(ssrcId);
          configuredEndpoint.audio.ssrcs.push(ssrcId);
        }
      });
  }

  // Remove video (audio-only for VoiceCircle)
  delete configuredEndpoint.video;

  // Remove data channel for configuration
  configuredEndpoint.data = undefined;

  return configuredEndpoint;
}

export default {
  Connection,
  createSdpOffer,
  parseAnswerForConfiguration
};
