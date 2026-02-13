import Redis from 'ioredis';

let redis;

// OSC Default Configuration
const OSC_DEFAULTS = {
  REDIS_URL: 'redis://172.232.131.169:10517'
};

// Key prefixes
const KEYS = {
  USER_ONLINE: 'user:online:',
  ROOM_PARTICIPANTS: 'room:participants:',
  ROOM_CHANNEL: 'room:channel:',
  ROOM_SESSION: 'room:session:', // NEW: WebRTC session tracking
  ACTIVE_ROOMS: 'active_rooms',
  USER_SESSION: 'user:session:',
  NOTIFICATIONS: 'notifications:'
};

// TTL values (in seconds)
const TTL = {
  USER_ONLINE: 300, // 5 minutes
  SESSION: 86400 * 7, // 7 days
  ROOM_SESSION: 3600 // 1 hour for WebRTC sessions
};

export async function initializeRedis() {
  const redisUrl = process.env.REDIS_URL || OSC_DEFAULTS.REDIS_URL;

  if (redisUrl) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true
    });
  } else {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  await redis.connect();

  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  redis.on('connect', () => {
    console.log('  Redis connected');
  });
}

// User presence
export async function setUserOnline(userId) {
  const key = `${KEYS.USER_ONLINE}${userId}`;
  await redis.setex(key, TTL.USER_ONLINE, Date.now().toString());
}

export async function setUserOffline(userId) {
  const key = `${KEYS.USER_ONLINE}${userId}`;
  await redis.del(key);
}

export async function isUserOnline(userId) {
  const key = `${KEYS.USER_ONLINE}${userId}`;
  const result = await redis.get(key);
  return result !== null;
}

export async function getOnlineUsers(userIds) {
  if (!userIds.length) return [];

  const keys = userIds.map(id => `${KEYS.USER_ONLINE}${id}`);
  const results = await redis.mget(keys);

  return userIds.filter((_, index) => results[index] !== null);
}

export async function refreshUserOnline(userId) {
  const key = `${KEYS.USER_ONLINE}${userId}`;
  await redis.expire(key, TTL.USER_ONLINE);
}

// Room participants
export async function addRoomParticipant(roomId, userId, role = 'listener') {
  const key = `${KEYS.ROOM_PARTICIPANTS}${roomId}`;
  const data = JSON.stringify({ userId, role, joinedAt: Date.now() });
  await redis.hset(key, userId, data);

  // Update active rooms sorted set (by participant count)
  await updateActiveRoomScore(roomId);
}

export async function removeRoomParticipant(roomId, userId) {
  const key = `${KEYS.ROOM_PARTICIPANTS}${roomId}`;
  await redis.hdel(key, userId);
  await updateActiveRoomScore(roomId);
}

export async function getRoomParticipants(roomId) {
  const key = `${KEYS.ROOM_PARTICIPANTS}${roomId}`;
  const participants = await redis.hgetall(key);

  return Object.entries(participants).map(([userId, data]) => ({
    userId,
    ...JSON.parse(data)
  }));
}

export async function getRoomParticipantCount(roomId) {
  const key = `${KEYS.ROOM_PARTICIPANTS}${roomId}`;
  return await redis.hlen(key);
}

export async function updateParticipantRole(roomId, userId, role) {
  const key = `${KEYS.ROOM_PARTICIPANTS}${roomId}`;
  const existing = await redis.hget(key, userId);

  if (existing) {
    const data = JSON.parse(existing);
    data.role = role;
    await redis.hset(key, userId, JSON.stringify(data));
  }
}

export async function clearRoomParticipants(roomId) {
  const key = `${KEYS.ROOM_PARTICIPANTS}${roomId}`;
  await redis.del(key);
  await redis.zrem(KEYS.ACTIVE_ROOMS, roomId);
  // Also clear the channel ID when room ends
  await redis.del(`${KEYS.ROOM_CHANNEL}${roomId}`);
}

// Room channel ID (for WHEP subscribers)
export async function setRoomChannelId(roomId, channelId) {
  const key = `${KEYS.ROOM_CHANNEL}${roomId}`;
  await redis.set(key, channelId);
}

export async function getRoomChannelId(roomId) {
  const key = `${KEYS.ROOM_CHANNEL}${roomId}`;
  return await redis.get(key);
}

// Active rooms (sorted by participant count)
async function updateActiveRoomScore(roomId) {
  const count = await getRoomParticipantCount(roomId);
  if (count > 0) {
    await redis.zadd(KEYS.ACTIVE_ROOMS, count, roomId);
  } else {
    await redis.zrem(KEYS.ACTIVE_ROOMS, roomId);
  }
}

export async function getActiveRooms(limit = 20) {
  // Get rooms sorted by participant count (descending)
  const rooms = await redis.zrevrange(KEYS.ACTIVE_ROOMS, 0, limit - 1, 'WITHSCORES');

  const result = [];
  for (let i = 0; i < rooms.length; i += 2) {
    result.push({
      roomId: rooms[i],
      participantCount: parseInt(rooms[i + 1])
    });
  }

  return result;
}

// User sessions
export async function setUserSession(userId, sessionData) {
  const key = `${KEYS.USER_SESSION}${userId}`;
  await redis.setex(key, TTL.SESSION, JSON.stringify(sessionData));
}

export async function getUserSession(userId) {
  const key = `${KEYS.USER_SESSION}${userId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function deleteUserSession(userId) {
  const key = `${KEYS.USER_SESSION}${userId}`;
  await redis.del(key);
}

// Notifications
export async function addNotification(userId, notification) {
  const key = `${KEYS.NOTIFICATIONS}${userId}`;
  await redis.lpush(key, JSON.stringify({
    ...notification,
    timestamp: Date.now()
  }));
  // Keep only last 100 notifications
  await redis.ltrim(key, 0, 99);
}

export async function getNotifications(userId, limit = 20) {
  const key = `${KEYS.NOTIFICATIONS}${userId}`;
  const notifications = await redis.lrange(key, 0, limit - 1);
  return notifications.map(n => JSON.parse(n));
}

export async function clearNotifications(userId) {
  const key = `${KEYS.NOTIFICATIONS}${userId}`;
  await redis.del(key);
}

// ============================================================
// Room Session Tracking (for direct SMB WebRTC connections)
// ============================================================

/**
 * Store WebRTC session data for a user in a room
 * @param {string} roomId - Room identifier
 * @param {string} userId - User identifier
 * @param {object} sessionData - Session data to store
 * @param {string} sessionData.endpointId - SMB endpoint identifier
 * @param {object} sessionData.endpointDescription - SMB endpoint description
 * @param {number} sessionData.joinedAt - Timestamp when user joined
 */
export async function setRoomSession(roomId, userId, sessionData) {
  const key = `${KEYS.ROOM_SESSION}${roomId}:${userId}`;
  const data = {
    ...sessionData,
    lastSeen: Date.now()
  };
  await redis.setex(key, TTL.ROOM_SESSION, JSON.stringify(data));
}

/**
 * Get WebRTC session data for a user in a room
 * @param {string} roomId - Room identifier
 * @param {string} userId - User identifier
 * @returns {Promise<object|null>} Session data or null if not found
 */
export async function getRoomSession(roomId, userId) {
  const key = `${KEYS.ROOM_SESSION}${roomId}:${userId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Delete WebRTC session data for a user
 * @param {string} roomId - Room identifier
 * @param {string} userId - User identifier
 */
export async function deleteRoomSession(roomId, userId) {
  const key = `${KEYS.ROOM_SESSION}${roomId}:${userId}`;
  await redis.del(key);
}

/**
 * Update the lastSeen timestamp for a session (heartbeat)
 * @param {string} roomId - Room identifier
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} True if session exists and was updated
 */
export async function updateSessionLastSeen(roomId, userId) {
  const key = `${KEYS.ROOM_SESSION}${roomId}:${userId}`;
  const data = await redis.get(key);

  if (!data) {
    return false;
  }

  const session = JSON.parse(data);
  session.lastSeen = Date.now();
  await redis.setex(key, TTL.ROOM_SESSION, JSON.stringify(session));
  return true;
}

/**
 * Get all sessions for a room
 * @param {string} roomId - Room identifier
 * @returns {Promise<Array>} Array of session data objects
 */
export async function getAllRoomSessions(roomId) {
  const pattern = `${KEYS.ROOM_SESSION}${roomId}:*`;
  const keys = await redis.keys(pattern);

  if (keys.length === 0) {
    return [];
  }

  const sessions = await redis.mget(keys);
  return sessions
    .filter(s => s !== null)
    .map(s => JSON.parse(s));
}

/**
 * Clear all sessions for a room
 * @param {string} roomId - Room identifier
 */
export async function clearAllRoomSessions(roomId) {
  const pattern = `${KEYS.ROOM_SESSION}${roomId}:*`;
  const keys = await redis.keys(pattern);

  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Pub/Sub for real-time updates
export function createSubscriber() {
  return redis.duplicate();
}

export async function publish(channel, message) {
  await redis.publish(channel, JSON.stringify(message));
}

export { redis, KEYS };
