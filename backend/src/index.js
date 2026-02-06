import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { initializeDatabase } from './services/database.js';
import { initializeStorage } from './services/storage.js';
import { initializeRedis } from './services/redis.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import roomRoutes from './routes/rooms.js';
import uploadRoutes from './routes/upload.js';
import healthRoutes from './routes/health.js';

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required when behind reverse proxy for rate limiting)
app.set('trust proxy', 1);

// Security middleware
const S3_DOMAIN = process.env.S3_ENDPOINT
  ? new URL(process.env.S3_ENDPOINT).host
  : 'team2-voicecirclestore.minio-minio.auto.prod.osaas.io';

// WebRTC gateway domains for CSP
const WHIP_DOMAIN = process.env.WHIP_URL
  ? new URL(process.env.WHIP_URL).origin
  : 'https://team2-vcwhip.eyevinn-smb-whip-bridge.auto.prod.osaas.io';

const WHEP_DOMAIN = process.env.WHEP_URL
  ? new URL(process.env.WHEP_URL).origin
  : 'https://team2-vcegress.eyevinn-wrtc-egress.auto.prod.osaas.io';

const SMB_DOMAIN = process.env.SMB_URL
  ? new URL(process.env.SMB_URL).origin
  : 'https://team2-vcsmb.eyevinn-docker-wrtc-sfu.auto.prod.osaas.io';

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", `https://${S3_DOMAIN}`],
      mediaSrc: ["'self'", "blob:", `https://${S3_DOMAIN}`],
      connectSrc: ["'self'", `https://${S3_DOMAIN}`, WHIP_DOMAIN, WHEP_DOMAIN, SMB_DOMAIN],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/upload', uploadRoutes);

// Serve static frontend files in production
app.use(express.static('public'));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile('index.html', { root: 'public' });
});

// Error handling
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting VoiceCircle server...');

    // Initialize database
    await initializeDatabase();
    console.log('✅ Database connected');

    // Initialize storage
    await initializeStorage();
    console.log('✅ Storage connected');

    // Initialize Redis
    await initializeRedis();
    console.log('✅ Redis connected');

    app.listen(PORT, () => {
      console.log(`✅ VoiceCircle server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
