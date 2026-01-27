// Symphony Media Bridge Service
// Handles WebRTC room management via SMB + WHIP/WHEP gateways

// OSC Default Configuration
const OSC_DEFAULTS = {
  SMB_URL: "https://team2-vcsmb.eyevinn-docker-wrtc-sfu.auto.prod.osaas.io",
  SMB_API_KEY: "voicecircle-api-key-2024",
  WHIP_URL: "https://team2-vcwhip.eyevinn-smb-whip-bridge.auto.prod.osaas.io",
  WHEP_URL: "https://team2-vcegress.eyevinn-wrtc-egress.auto.prod.osaas.io",
};

const SMB_URL = process.env.SMB_URL || OSC_DEFAULTS.SMB_URL;
const SMB_API_KEY = process.env.SMB_API_KEY || OSC_DEFAULTS.SMB_API_KEY;
const WHIP_URL = process.env.WHIP_URL || OSC_DEFAULTS.WHIP_URL;
const WHEP_URL = process.env.WHEP_URL || OSC_DEFAULTS.WHEP_URL;

// Create a new conference/room in SMB
export async function createConference(conferenceId) {
  // Skip conference creation - let it be created automatically on first join
  console.log(`Skipping SMB conference creation for: ${conferenceId}`);
  return { conferenceId };
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
export function getWhipEndpoint(conferenceId, participantId) {
  return `${WHIP_URL}/whip/${conferenceId}/${participantId}`;
}

// Generate WHEP endpoint URL for a participant to subscribe
export function getWhepEndpoint(conferenceId, participantId) {
  return `${WHEP_URL}/whep/${conferenceId}/${participantId}`;
}

// Get signaling info for a room
export async function getRoomSignaling(roomId, userId, isPublisher = false) {
  // Conference should be created automatically when first participant joins
  // No need to explicitly create it here

  return {
    roomId,
    userId,
    whipEndpoint: isPublisher ? getWhipEndpoint(roomId, userId) : null,
    whepEndpoint: getWhepEndpoint(roomId, userId),
    smbUrl: SMB_URL,
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
