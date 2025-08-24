import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// AWS Configuration - only initialize if credentials are available
export const s3Client = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? new S3Client({
      region: process.env.AWS_REGION || "us-east-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

// S3 Bucket Configuration
export const S3_BUCKET_NAME =
  process.env.AWS_S3_BUCKET_NAME || "pro-dj-production-files";
export const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN;

// File size limits (in bytes)
export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

// Allowed audio formats
export const ALLOWED_AUDIO_FORMATS = [
  "audio/mpeg", // .mp3
  "audio/wav", // .wav
  "audio/ogg", // .ogg
  "audio/mp4", // .m4a
  "audio/aac", // .aac
];

// Generate S3 key for file
export function generateS3Key(djId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `mixes/${djId}/${timestamp}_${sanitizedFileName}`;
}

// Generate presigned URL for direct upload
export async function generatePresignedUploadUrl(
  s3Key: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  if (!s3Client) {
    throw new Error("AWS S3 client not configured");
  }
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Generate presigned URL for file download
export async function generatePresignedDownloadUrl(
  s3Key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  if (!s3Client) {
    throw new Error("AWS S3 client not configured");
  }
  
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Delete file from S3
export async function deleteFileFromS3(s3Key: string): Promise<void> {
  if (!s3Client) {
    throw new Error("AWS S3 client not configured");
  }
  
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
  });

  await s3Client.send(command);
}

// Generate CloudFront URL
export function generateCloudFrontUrl(s3Key: string): string {
  if (!CLOUDFRONT_DOMAIN) {
    throw new Error("CloudFront domain not configured");
  }
  return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
}

// Validate file format
export function isValidAudioFormat(mimeType: string): boolean {
  return ALLOWED_AUDIO_FORMATS.includes(mimeType);
}

// Validate file size
export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

// Get file extension from mime type
export function getFileExtension(mimeType: string): string {
  const extensions: { [key: string]: string } = {
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/aac": "aac",
  };
  return extensions[mimeType] || "mp3";
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Format duration for display
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export { s3Client };
