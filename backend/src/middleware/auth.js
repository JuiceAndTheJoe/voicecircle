import jwt from 'jsonwebtoken';
import { getUserById } from '../services/database.js';
import { setUserOnline } from '../services/redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'voicecircle-secret-key';

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Remove sensitive data
    delete user.password;

    req.user = user;
    req.userId = user._id;

    // Update user presence
    await setUserOnline(user._id);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await getUserById(decoded.userId);

      if (user) {
        delete user.password;
        req.user = user;
        req.userId = user._id;
        await setUserOnline(user._id);
      }
    }

    next();
  } catch (error) {
    // Continue without auth for optional routes
    next();
  }
}

export default { generateToken, verifyToken, authenticate, optionalAuth };
