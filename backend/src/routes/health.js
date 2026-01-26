import { Router } from 'express';
import { checkSmbHealth } from '../services/smb.js';

const router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {}
  };

  // Check CouchDB
  try {
    const { nano } = await import('../services/database.js');
    await nano.db.list();
    health.services.couchdb = 'connected';
  } catch (error) {
    health.services.couchdb = 'disconnected';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    const { redis } = await import('../services/redis.js');
    await redis.ping();
    health.services.redis = 'connected';
  } catch (error) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }

  // Check S3/MinIO
  try {
    const { s3Client, BUCKET } = await import('../services/storage.js');
    const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    health.services.storage = 'connected';
  } catch (error) {
    health.services.storage = 'disconnected';
    health.status = 'degraded';
  }

  // Check SMB
  try {
    const smbHealthy = await checkSmbHealth();
    health.services.smb = smbHealthy ? 'connected' : 'disconnected';
    if (!smbHealthy) health.status = 'degraded';
  } catch (error) {
    health.services.smb = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Liveness probe
router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    const { nano } = await import('../services/database.js');
    await nano.db.list();
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

export default router;
