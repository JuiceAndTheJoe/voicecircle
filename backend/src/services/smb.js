// Symphony Media Bridge Service
// Handles WebRTC room management via direct SMB API integration
// (WHIP/WHEP bridges deprecated due to bug with empty video.streams)

// OSC Default Configuration
const OSC_DEFAULTS = {
  SMB_URL: "https://team2-vcsmb2.eyevinn-docker-wrtc-sfu.auto.prod.osaas.io",
  SMB_API_KEY: "voicecircle-api-key-2024",
  // WHIP/WHEP URLs kept for reference but no longer used
  // WHIP_URL: "https://team2-vcwhip2.eyevinn-smb-whip-bridge.auto.prod.osaas.io",
  // WHEP_URL: "https://team2-vcegress2.eyevinn-wrtc-egress.auto.prod.osaas.io",
  // TURN server for NAT traversal
  TURN_URL: "team2-vcturn.srperens-uturn.auto.prod.osaas.io",
  TURN_USERNAME: "voicecircle",
  TURN_PASSWORD: "voicecircle2024",
};

const SMB_URL = process.env.SMB_URL || OSC_DEFAULTS.SMB_URL;
const SMB_API_KEY = process.env.SMB_API_KEY || OSC_DEFAULTS.SMB_API_KEY;
const TURN_URL = process.env.TURN_URL || OSC_DEFAULTS.TURN_URL;
const TURN_USERNAME = process.env.TURN_USERNAME || OSC_DEFAULTS.TURN_USERNAME;
const TURN_PASSWORD = process.env.TURN_PASSWORD || OSC_DEFAULTS.TURN_PASSWORD;

// Create a new conference/room in SMB
export async function createConference(conferenceId) {
  try {
    const response = await fetch(`${SMB_URL}/conferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SMB_API_KEY}`,
      },
      body: JSON.stringify({
        id: conferenceId,
      }),
    });

    if (!response.ok) {
      // Conference might already exist, that's okay
      if (response.status === 409) {
        return { conferenceId };
      }
      throw new Error(`Failed to create conference: ${response.statusText}`);
    }

    return { conferenceId };
  } catch {
    // Don't fail the room creation if conference creation fails
    return { conferenceId };
  }
}

// Delete a conference
export async function deleteConference(conferenceId) {
  const response = await fetch(`${SMB_URL}/conferences/${conferenceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SMB_API_KEY}`,
    },
  });

  return response.ok;
}

// Get conference info
export async function getConference(conferenceId) {
  const response = await fetch(`${SMB_URL}/conferences/${conferenceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SMB_API_KEY}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to get conference: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================
// Direct SMB API Integration (replaces WHIP/WHEP bridges)
// ============================================================

/**
 * Allocate an endpoint in a conference for direct WebRTC connection
 * @param {string} conferenceId - The conference/room ID
 * @param {string} endpointId - Unique endpoint identifier for this participant
 * @param {object} options - Allocation options
 * @param {boolean} options.audio - Enable audio (default: true)
 * @param {boolean} options.data - Enable data channel (default: true)
 * @param {string} options.relayType - Audio relay type: 'ssrc-rewrite' | 'forwarder' | 'mixed'
 * @param {number} options.idleTimeout - Timeout in seconds before endpoint cleanup
 * @returns {Promise<object>} SMB endpoint description with ICE candidates, codecs, etc.
 */
export async function allocateEndpoint(conferenceId, endpointId, options = {}) {
  const {
    audio = true,
    data = true,
    relayType = 'ssrc-rewrite',
    idleTimeout = 60
  } = options;

  const request = {
    action: 'allocate',
    'bundle-transport': {
      'ice-controlling': true,
      ice: true,
      dtls: true,
      sdes: false
    }
  };

  if (audio) {
    request.audio = { 'relay-type': relayType };
  }

  if (data) {
    request.data = {};
  }

  if (idleTimeout) {
    request.idleTimeout = idleTimeout;
  }

  const url = `${SMB_URL}/conferences/${conferenceId}/${endpointId}`;
  console.log('[SMB] Allocating endpoint:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SMB_API_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Failed to allocate endpoint: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const endpointDescription = await response.json();
  console.log('[SMB] Endpoint allocated successfully');
  return endpointDescription;
}

/**
 * Configure an endpoint with client's SDP answer parameters
 * @param {string} conferenceId - The conference/room ID
 * @param {string} endpointId - The endpoint identifier
 * @param {object} endpointDescription - Updated endpoint description with client's ICE/DTLS params
 * @returns {Promise<void>}
 */
export async function configureEndpoint(conferenceId, endpointId, endpointDescription) {
  const request = JSON.parse(JSON.stringify(endpointDescription));
  request.action = 'configure';

  const url = `${SMB_URL}/conferences/${conferenceId}/${endpointId}`;
  console.log('[SMB] Configuring endpoint:', url);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SMB_API_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Failed to configure endpoint: ${response.status} ${response.statusText} - ${errorText}`);
  }

  console.log('[SMB] Endpoint configured successfully');
}

/**
 * Delete an endpoint from a conference
 * @param {string} conferenceId - The conference/room ID
 * @param {string} endpointId - The endpoint identifier to delete
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteEndpoint(conferenceId, endpointId) {
  const url = `${SMB_URL}/conferences/${conferenceId}/${endpointId}`;
  console.log('[SMB] Deleting endpoint:', url);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SMB_API_KEY}`,
      },
    });

    if (response.ok) {
      console.log('[SMB] Endpoint deleted successfully');
      return true;
    }
    console.warn('[SMB] Endpoint deletion returned:', response.status);
    return false;
  } catch (error) {
    console.warn('[SMB] Failed to delete endpoint:', error.message);
    return false;
  }
}

/**
 * Get ICE servers configuration for WebRTC
 * @returns {Array} ICE servers array for RTCPeerConnection
 */
export function getIceServers() {
  return [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: [
        `turn:${TURN_URL}:3478`,
        `turn:${TURN_URL}:3478?transport=tcp`,
      ],
      username: TURN_USERNAME,
      credential: TURN_PASSWORD,
    },
  ];
}

// ============================================================
// Legacy WHIP/WHEP functions (deprecated but kept for reference)
// ============================================================

// DEPRECATED: WHIP/WHEP bridges have a bug with empty video.streams
// Use allocateEndpoint/configureEndpoint instead
export function getWhipEndpoint(conferenceId) {
  console.warn('[SMB] getWhipEndpoint is deprecated - use allocateEndpoint instead');
  return null;
}

export function getWhepEndpoint(conferenceId) {
  console.warn('[SMB] getWhepEndpoint is deprecated - use direct SMB integration');
  return null;
}

// DEPRECATED: Use allocateEndpoint + createSdpOffer instead
export async function getRoomSignaling(roomId, userId, isPublisher = false) {
  console.warn('[SMB] getRoomSignaling is deprecated - use join route with SDP exchange');
  return {
    roomId,
    userId,
    iceServers: getIceServers(),
  };
}

// List all active conferences
export async function listConferences() {
  const response = await fetch(`${SMB_URL}/conferences`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SMB_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list conferences: ${response.statusText}`);
  }

  return response.json();
}

// Check SMB health
export async function checkSmbHealth() {
  try {
    const response = await fetch(`${SMB_URL}/health`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SMB_API_KEY}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  // Core conference management
  createConference,
  deleteConference,
  getConference,
  listConferences,
  checkSmbHealth,
  // Direct SMB API (new)
  allocateEndpoint,
  configureEndpoint,
  deleteEndpoint,
  getIceServers,
  // Legacy WHIP/WHEP (deprecated)
  getWhipEndpoint,
  getWhepEndpoint,
  getRoomSignaling,
};
