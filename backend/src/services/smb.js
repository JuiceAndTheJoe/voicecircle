// Symphony Media Bridge Service
// Handles WebRTC room management via SMB + WHIP/WHEP gateways

const SMB_URL = process.env.SMB_URL;
const SMB_API_KEY = process.env.SMB_API_KEY;
const WHIP_URL = process.env.WHIP_URL;
const WHEP_URL = process.env.WHEP_URL;

// Create a new conference/room in SMB
export async function createConference(conferenceId) {
  const response = await fetch(`${SMB_URL}/conferences/${conferenceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SMB_API_KEY}`
    },
    body: JSON.stringify({
      'last-n': 16 // Max number of video streams
    })
  });

  if (!response.ok && response.status !== 409) { // 409 = already exists
    throw new Error(`Failed to create conference: ${response.statusText}`);
  }

  return { conferenceId };
}

// Delete a conference
export async function deleteConference(conferenceId) {
  const response = await fetch(`${SMB_URL}/conferences/${conferenceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${SMB_API_KEY}`
    }
  });

  return response.ok;
}

// Get conference info
export async function getConference(conferenceId) {
  const response = await fetch(`${SMB_URL}/conferences/${conferenceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SMB_API_KEY}`
    }
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
  // Create conference if it doesn't exist
  await createConference(roomId);

  return {
    roomId,
    userId,
    whipEndpoint: isPublisher ? getWhipEndpoint(roomId, userId) : null,
    whepEndpoint: getWhepEndpoint(roomId, userId),
    smbUrl: SMB_URL
  };
}

// List all active conferences
export async function listConferences() {
  const response = await fetch(`${SMB_URL}/conferences`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SMB_API_KEY}`
    }
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
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SMB_API_KEY}`
      }
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
  checkSmbHealth
};
