// Symphony Media Bridge Service
// Handles WebRTC room management via SMB + WHIP/WHEP gateways

// OSC Default Configuration
const OSC_DEFAULTS = {
  SMB_URL: "https://team2-vcsmb2.eyevinn-docker-wrtc-sfu.auto.prod.osaas.io",
  SMB_API_KEY: "voicecircle-api-key-2024",
  WHIP_URL: "https://team2-vcwhip2.eyevinn-smb-whip-bridge.auto.prod.osaas.io",
  WHEP_URL: "https://team2-vcegress.eyevinn-wrtc-egress.auto.prod.osaas.io",
  // TURN server for NAT traversal
  TURN_URL: "team2-vcturn.srperens-uturn.auto.prod.osaas.io",
  TURN_USERNAME: "voicecircle",
  TURN_PASSWORD: "voicecircle2024",
};

const SMB_URL = process.env.SMB_URL || OSC_DEFAULTS.SMB_URL;
const SMB_API_KEY = process.env.SMB_API_KEY || OSC_DEFAULTS.SMB_API_KEY;
const WHIP_URL = process.env.WHIP_URL || OSC_DEFAULTS.WHIP_URL;
const WHEP_URL = process.env.WHEP_URL || OSC_DEFAULTS.WHEP_URL;
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
        console.log(`Conference ${conferenceId} already exists`);
        return { conferenceId };
      }
      throw new Error(`Failed to create conference: ${response.statusText}`);
    }

    console.log(`Created SMB conference: ${conferenceId}`);
    return { conferenceId };
  } catch (error) {
    console.error(`Error creating conference ${conferenceId}:`, error.message);
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

// Generate WHIP endpoint URL for a participant to publish
// The WHIP bridge uses a shared plugin endpoint, not per-room endpoints
// It auto-generates a channel ID which becomes the conference identifier
export function getWhipEndpoint(conferenceId) {
  return `${WHIP_URL}/api/v2/whip/sfu-broadcaster`;
}

// Generate WHEP endpoint URL for a participant to subscribe
// All subscribers use the same channel endpoint - the channel ID matches the conference ID
export function getWhepEndpoint(conferenceId) {
  return `${WHEP_URL}/whep/channel/${conferenceId}`;
}

// Get signaling info for a room
export async function getRoomSignaling(roomId, userId, isPublisher = false) {
  // Conference is created when room is created
  return {
    roomId,
    userId,
    whipEndpoint: isPublisher ? getWhipEndpoint(roomId) : null,
    whepBaseUrl: WHEP_URL, // Base URL for constructing WHEP endpoint with channel ID
    smbUrl: SMB_URL,
    apiKey: SMB_API_KEY, // Required for WHIP/WHEP authentication
    // ICE servers including TURN for NAT traversal
    iceServers: [
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
    ],
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
  createConference,
  deleteConference,
  getConference,
  getWhipEndpoint,
  getWhepEndpoint,
  getRoomSignaling,
  listConferences,
  checkSmbHealth,
};
