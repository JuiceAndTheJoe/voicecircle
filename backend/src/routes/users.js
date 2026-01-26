import { Router } from 'express';
import {
  getUserById,
  getUserByUsername,
  updateUser,
  searchUsers,
  createRelationship,
  deleteRelationship,
  getFollowers,
  getFollowing,
  isFollowing
} from '../services/database.js';
import { isUserOnline, getOnlineUsers } from '../services/redis.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate, updateProfileRules, paginationRules } from '../middleware/validation.js';

const router = Router();

// Get user by ID
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    delete user.password;

    // Check if current user is following this user
    let following = false;
    if (req.userId) {
      following = await isFollowing(req.userId, user._id);
    }

    // Check online status
    const online = await isUserOnline(user._id);

    res.json({
      user: { ...user, online },
      isFollowing: following
    });
  } catch (error) {
    next(error);
  }
});

// Get user by username
router.get('/username/:username', optionalAuth, async (req, res, next) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    delete user.password;

    let following = false;
    if (req.userId) {
      following = await isFollowing(req.userId, user._id);
    }

    const online = await isUserOnline(user._id);

    res.json({
      user: { ...user, online },
      isFollowing: following
    });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.patch('/me', authenticate, updateProfileRules, validate, async (req, res, next) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    const user = await updateUser(req.userId, updates);
    delete user.password;

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Search users
router.get('/', paginationRules, validate, async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const users = await searchUsers(q, parseInt(limit));

    // Remove passwords and add online status
    const userIds = users.map(u => u._id);
    const onlineUsers = await getOnlineUsers(userIds);

    const results = users.map(user => {
      delete user.password;
      return {
        ...user,
        online: onlineUsers.includes(user._id)
      };
    });

    res.json({ users: results });
  } catch (error) {
    next(error);
  }
});

// Follow user
router.post('/:id/follow', authenticate, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const alreadyFollowing = await isFollowing(req.userId, targetUserId);
    if (alreadyFollowing) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create relationship
    await createRelationship(req.userId, targetUserId);

    // Update follower/following counts
    await updateUser(req.userId, {
      followingCount: (req.user.followingCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    await updateUser(targetUserId, {
      followersCount: (targetUser.followersCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Followed successfully', following: true });
  } catch (error) {
    next(error);
  }
});

// Unfollow user
router.delete('/:id/follow', authenticate, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // Check if following
    const following = await isFollowing(req.userId, targetUserId);
    if (!following) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    const targetUser = await getUserById(targetUserId);

    // Delete relationship
    await deleteRelationship(req.userId, targetUserId);

    // Update follower/following counts
    await updateUser(req.userId, {
      followingCount: Math.max((req.user.followingCount || 1) - 1, 0),
      updatedAt: new Date().toISOString()
    });

    if (targetUser) {
      await updateUser(targetUserId, {
        followersCount: Math.max((targetUser.followersCount || 1) - 1, 0),
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ message: 'Unfollowed successfully', following: false });
  } catch (error) {
    next(error);
  }
});

// Get followers
router.get('/:id/followers', paginationRules, validate, async (req, res, next) => {
  try {
    const followers = await getFollowers(req.params.id);
    const followerIds = followers.map(f => f.followerId);

    // Get full user data
    const users = await Promise.all(
      followerIds.map(id => getUserById(id))
    );

    // Get online status
    const onlineUsers = await getOnlineUsers(followerIds);

    const results = users
      .filter(u => u !== null)
      .map(user => {
        delete user.password;
        return {
          ...user,
          online: onlineUsers.includes(user._id)
        };
      });

    res.json({ followers: results });
  } catch (error) {
    next(error);
  }
});

// Get following
router.get('/:id/following', paginationRules, validate, async (req, res, next) => {
  try {
    const following = await getFollowing(req.params.id);
    const followingIds = following.map(f => f.followingId);

    // Get full user data
    const users = await Promise.all(
      followingIds.map(id => getUserById(id))
    );

    // Get online status
    const onlineUsers = await getOnlineUsers(followingIds);

    const results = users
      .filter(u => u !== null)
      .map(user => {
        delete user.password;
        return {
          ...user,
          online: onlineUsers.includes(user._id)
        };
      });

    res.json({ following: results });
  } catch (error) {
    next(error);
  }
});

export default router;
