import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createUser, getUserByEmail, getUserByUsername } from '../services/database.js';
import { setUserOnline, setUserSession, deleteUserSession } from '../services/redis.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validate, registerRules, loginRules } from '../middleware/validation.js';

const router = Router();

// Register new user
router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user exists
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await createUser({
      _id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
      bio: '',
      avatarUrl: null,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Generate token
    const token = generateToken(user);

    // Set user online (non-blocking)
    Promise.all([
      setUserOnline(user._id),
      setUserSession(user._id, { token, createdAt: Date.now() })
    ]).catch(() => {});

    // Remove password from response
    delete user.password;

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Set user online (non-blocking)
    Promise.all([
      setUserOnline(user._id),
      setUserSession(user._id, { token, createdAt: Date.now() })
    ]).catch(() => {});

    // Remove password from response
    delete user.password;

    res.json({
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { setUserOffline } = await import('../services/redis.js');
    // Non-blocking cleanup
    Promise.all([
      setUserOffline(req.userId),
      deleteUserSession(req.userId)
    ]).catch(() => {});

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Refresh token
router.post('/refresh', authenticate, async (req, res, next) => {
  try {
    const token = generateToken(req.user);
    // Non-blocking session update
    setUserSession(req.userId, { token, createdAt: Date.now() }).catch(() => {});

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

export default router;
