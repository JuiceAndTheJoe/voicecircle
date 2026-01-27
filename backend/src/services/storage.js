import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client;

// OSC Default Configuration
const OSC_DEFAULTS = {
  S3_ENDPOINT: 'https://team2-voicecirclestore.minio-minio.auto.prod.osaas.io',
  S3_ACCESS_KEY: 'voicecircleadmin',
  S3_SECRET_KEY: 'VoiceCircle2026!'
};

const BUCKET = process.env.S3_BUCKET || 'voicecircle';

// Prefixes for different media types
export const PREFIXES = {
  AVATARS: 'avatars/',
  VOICE_MESSAGES: 'voice-messages/',
  VIDEO_CLIPS: 'video-clips/'
};

export async function initializeStorage() {
  const endpoint = process.env.S3_ENDPOINT || OSC_DEFAULTS.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESS_KEY || OSC_DEFAULTS.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY || OSC_DEFAULTS.S3_SECRET_KEY;
  const region = process.env.S3_REGION || 'us-east-1';

  s3Client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    },
    forcePathStyle: true // Required for MinIO
  });

  // Ensure bucket exists
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`  Bucket ${BUCKET} exists`);
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
        console.log(`  Created bucket: ${BUCKET}`);
      } catch (createError) {
        console.log(`  Bucket creation note: ${createError.message}`);
      }
    }
  }
}

export async function uploadFile(key, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType
  });

  await s3Client.send(command);
  return getPublicUrl(key);
}

export async function uploadAvatar(userId, buffer, contentType) {
  const extension = contentType.split('/')[1] || 'jpg';
  const key = `${PREFIXES.AVATARS}${userId}.${extension}`;
  return uploadFile(key, buffer, contentType);
}

export async function uploadVoiceMessage(postId, buffer, contentType) {
  const extension = contentType.includes('webm') ? 'webm' :
                   contentType.includes('ogg') ? 'ogg' : 'mp3';
  const key = `${PREFIXES.VOICE_MESSAGES}${postId}.${extension}`;

  // Upload the file
  await uploadFile(key, buffer, contentType);

  // Return public URL for voice messages (they're user content)
  return getPublicUrl(key);
}

export async function uploadVideoClip(postId, buffer, contentType) {
  const extension = contentType.includes('webm') ? 'webm' : 'mp4';
  const key = `${PREFIXES.VIDEO_CLIPS}${postId}.${extension}`;
  return uploadFile(key, buffer, contentType);
}

export async function getFile(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  const response = await s3Client.send(command);
  return response;
}

export async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  await s3Client.send(command);
}

export async function getSignedUploadUrl(key, contentType, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getSignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export function getPublicUrl(key) {
  const endpoint = process.env.S3_ENDPOINT || OSC_DEFAULTS.S3_ENDPOINT;
  return `${endpoint}/${BUCKET}/${key}`;
}

export async function listFiles(prefix, maxKeys = 100) {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    MaxKeys: maxKeys
  });

  const response = await s3Client.send(command);
  return response.Contents || [];
}

export { s3Client, BUCKET };
