import Nano from 'nano';

let nano;
let usersDb;
let postsDb;
let roomsDb;
let relationshipsDb;

const DATABASES = ['users', 'posts', 'rooms', 'relationships'];

// OSC Default Configuration
const OSC_DEFAULTS = {
  COUCHDB_URL: 'https://team2-voicecircledb.apache-couchdb.auto.prod.osaas.io',
  COUCHDB_USER: 'admin',
  COUCHDB_PASSWORD: 'voicecircle2026db'
};

export async function initializeDatabase() {
  const couchUrl = process.env.COUCHDB_URL || OSC_DEFAULTS.COUCHDB_URL;
  const user = process.env.COUCHDB_USER || OSC_DEFAULTS.COUCHDB_USER;
  const password = process.env.COUCHDB_PASSWORD || OSC_DEFAULTS.COUCHDB_PASSWORD;

  // Construct authenticated URL
  const urlObj = new URL(couchUrl);
  urlObj.username = user;
  urlObj.password = password;

  nano = Nano(urlObj.toString());

  // Create databases if they don't exist
  for (const dbName of DATABASES) {
    try {
      await nano.db.create(dbName);
      console.log(`  Created database: ${dbName}`);
    } catch (error) {
      if (error.statusCode !== 412) { // 412 = already exists
        console.log(`  Database ${dbName} already exists`);
      }
    }
  }

  usersDb = nano.db.use('users');
  postsDb = nano.db.use('posts');
  roomsDb = nano.db.use('rooms');
  relationshipsDb = nano.db.use('relationships');

  // Create indexes
  await createIndexes();
}

async function createIndexes() {
  // Users indexes
  try {
    await usersDb.createIndex({
      index: { fields: ['username'] },
      name: 'username-index'
    });
    await usersDb.createIndex({
      index: { fields: ['email'] },
      name: 'email-index'
    });
  } catch (e) { /* Index might already exist */ }

  // Posts indexes
  try {
    await postsDb.createIndex({
      index: { fields: ['userId', 'createdAt'] },
      name: 'user-posts-index'
    });
    await postsDb.createIndex({
      index: { fields: ['createdAt'] },
      name: 'posts-date-index'
    });
  } catch (e) { /* Index might already exist */ }

  // Rooms indexes
  try {
    await roomsDb.createIndex({
      index: { fields: ['isLive', 'createdAt'] },
      name: 'live-rooms-index'
    });
  } catch (e) { /* Index might already exist */ }

  // Relationships indexes
  try {
    await relationshipsDb.createIndex({
      index: { fields: ['followerId'] },
      name: 'follower-index'
    });
    await relationshipsDb.createIndex({
      index: { fields: ['followingId'] },
      name: 'following-index'
    });
  } catch (e) { /* Index might already exist */ }
}

// User operations
export async function createUser(user) {
  const result = await usersDb.insert(user);
  return { ...user, _id: result.id, _rev: result.rev };
}

export async function getUserById(id) {
  try {
    return await usersDb.get(id);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function getUserByUsername(username) {
  const result = await usersDb.find({
    selector: { username },
    limit: 1
  });
  return result.docs[0] || null;
}

export async function getUserByEmail(email) {
  const result = await usersDb.find({
    selector: { email },
    limit: 1
  });
  return result.docs[0] || null;
}

export async function updateUser(id, updates) {
  const user = await usersDb.get(id);
  const updated = { ...user, ...updates };
  const result = await usersDb.insert(updated);
  return { ...updated, _rev: result.rev };
}

export async function searchUsers(query, limit = 20) {
  const result = await usersDb.find({
    selector: {
      username: { $regex: `(?i)${query}` }
    },
    limit
  });
  return result.docs;
}

// Post operations
export async function createPost(post) {
  const result = await postsDb.insert(post);
  return { ...post, _id: result.id, _rev: result.rev };
}

export async function getPostById(id) {
  try {
    return await postsDb.get(id);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function getPostsByUser(userId, limit = 20, skip = 0) {
  const result = await postsDb.find({
    selector: { userId },
    sort: [{ createdAt: 'desc' }],
    limit,
    skip
  });
  return result.docs;
}

export async function getFeedPosts(userIds, limit = 20, skip = 0) {
  const result = await postsDb.find({
    selector: {
      userId: { $in: userIds }
    },
    sort: [{ createdAt: 'desc' }],
    limit,
    skip
  });
  return result.docs;
}

export async function getAllPosts(limit = 20, skip = 0) {
  const result = await postsDb.find({
    selector: { _id: { $gt: null } },
    sort: [{ createdAt: 'desc' }],
    limit,
    skip
  });
  return result.docs;
}

export async function updatePost(id, updates) {
  const post = await postsDb.get(id);
  const updated = { ...post, ...updates };
  const result = await postsDb.insert(updated);
  return { ...updated, _rev: result.rev };
}

export async function deletePost(id) {
  const post = await postsDb.get(id);
  await postsDb.destroy(id, post._rev);
}

// Room operations
export async function createRoom(room) {
  const result = await roomsDb.insert(room);
  return { ...room, _id: result.id, _rev: result.rev };
}

export async function getRoomById(id) {
  try {
    return await roomsDb.get(id);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function getLiveRooms(limit = 20) {
  const result = await roomsDb.find({
    selector: { isLive: true },
    sort: [{ createdAt: 'desc' }],
    limit
  });
  return result.docs;
}

export async function updateRoom(id, updates) {
  const room = await roomsDb.get(id);
  const updated = { ...room, ...updates };
  const result = await roomsDb.insert(updated);
  return { ...updated, _rev: result.rev };
}

export async function deleteRoom(id) {
  const room = await roomsDb.get(id);
  await roomsDb.destroy(id, room._rev);
}

// Relationship operations
export async function createRelationship(followerId, followingId) {
  const relationship = {
    _id: `${followerId}_${followingId}`,
    followerId,
    followingId,
    createdAt: new Date().toISOString()
  };
  const result = await relationshipsDb.insert(relationship);
  return { ...relationship, _rev: result.rev };
}

export async function deleteRelationship(followerId, followingId) {
  const id = `${followerId}_${followingId}`;
  try {
    const rel = await relationshipsDb.get(id);
    await relationshipsDb.destroy(id, rel._rev);
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }
}

export async function getFollowers(userId) {
  const result = await relationshipsDb.find({
    selector: { followingId: userId }
  });
  return result.docs;
}

export async function getFollowing(userId) {
  const result = await relationshipsDb.find({
    selector: { followerId: userId }
  });
  return result.docs;
}

export async function isFollowing(followerId, followingId) {
  try {
    await relationshipsDb.get(`${followerId}_${followingId}`);
    return true;
  } catch {
    return false;
  }
}

export { nano, usersDb, postsDb, roomsDb, relationshipsDb };
