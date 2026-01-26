import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import {
  uploadAvatar,
  uploadVoiceMessage,
  uploadVideoClip,
  getSignedUploadUrl,
  PREFIXES
} from '../services/storage.js';
import { updateUser } from '../services/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/webm',
      'audio/ogg',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'video/webm',
      'video/mp4',
      'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  }
});

// Upload avatar
router.post('/avatar', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type for avatar' });
    }

    const url = await uploadAvatar(req.userId, req.file.buffer, req.file.mimetype);

    // Update user's avatar URL
    await updateUser(req.userId, {
      avatarUrl: url,
      updatedAt: new Date().toISOString()
    });

    res.json({ url });
  } catch (error) {
    next(error);
  }
});

// Upload voice message
router.post('/voice', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const allowedTypes = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3', 'audio/wav'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type for voice message' });
    }

    const postId = uuidv4();
    const url = await uploadVoiceMessage(postId, req.file.buffer, req.file.mimetype);

    res.json({ url, postId });
  } catch (error) {
    next(error);
  }
});

// Upload video clip
router.post('/video', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const allowedTypes = ['video/webm', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type for video' });
    }

    const postId = uuidv4();
    const url = await uploadVideoClip(postId, req.file.buffer, req.file.mimetype);

    res.json({ url, postId });
  } catch (error) {
    next(error);
  }
});

// Get pre-signed upload URL (for client-side uploads)
router.post('/presigned-url', authenticate, async (req, res, next) => {
  try {
    const { type, contentType } = req.body;

    if (!type || !contentType) {
      return res.status(400).json({ error: 'Type and contentType required' });
    }

    let prefix;
    switch (type) {
      case 'avatar':
        prefix = PREFIXES.AVATARS;
        break;
      case 'voice':
        prefix = PREFIXES.VOICE_MESSAGES;
        break;
      case 'video':
        prefix = PREFIXES.VIDEO_CLIPS;
        break;
      default:
        return res.status(400).json({ error: 'Invalid upload type' });
    }

    const fileId = uuidv4();
    const extension = contentType.split('/')[1] || 'bin';
    const key = `${prefix}${fileId}.${extension}`;

    const uploadUrl = await getSignedUploadUrl(key, contentType, 3600);

    res.json({
      uploadUrl,
      fileId,
      key,
      expiresIn: 3600
    });
  } catch (error) {
    next(error);
  }
});

export default router;
