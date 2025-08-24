import multer from "multer";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Configure multer for file uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// File types for different upload contexts
export const UPLOAD_TYPES = {
  PROFILE_PICTURE: "profile-pictures",
  EVENT_PHOTO: "event-photos",
  PORTFOLIO: "portfolio",
  DOCUMENT: "documents",
} as const;

export type UploadType = (typeof UPLOAD_TYPES)[keyof typeof UPLOAD_TYPES];

// AWS S3 Configuration
const s3Client = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? new S3Client({
      region: process.env.AWS_REGION || "us-east-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "pro-dj-production-files";

// Process and save uploaded image
export async function processAndSaveImage(
  file: Express.Multer.File,
  uploadType: UploadType,
  userId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "jpeg" | "png" | "webp";
  }
) {
  try {
    // Generate unique filename
    const fileExtension = options?.format || "jpeg";
    const filename = `${uuidv4()}.${fileExtension}`;
    const s3Key = `${uploadType}/${userId}/${filename}`;

    // Process image with Sharp
    let imageProcessor = sharp(file.buffer);

    // Resize if dimensions provided
    if (options?.width || options?.height) {
      imageProcessor = imageProcessor.resize(options.width, options.height, {
        fit: "cover",
        position: "center",
      });
    }

    // Convert to specified format and quality
    let processedBuffer: Buffer;
    if (options?.format === "webp") {
      processedBuffer = await imageProcessor.webp({ quality: options?.quality || 80 }).toBuffer();
    } else if (options?.format === "png") {
      processedBuffer = await imageProcessor.png({ quality: options?.quality || 80 }).toBuffer();
    } else {
      processedBuffer = await imageProcessor.jpeg({ quality: options?.quality || 80 }).toBuffer();
    }

    // Upload to S3 if configured, otherwise fallback to local storage
    if (s3Client) {
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        Body: processedBuffer,
        ContentType: `image/${options?.format || "jpeg"}`,
        // Remove ACL since bucket has ACLs disabled
      });

      await s3Client.send(command);

      // Return S3 key (we'll generate presigned URLs when needed)
      return {
        filename,
        originalName: file.originalname,
        mimeType: `image/${options?.format || "jpeg"}`,
        size: file.size,
        url: `/api/files/${s3Key}`, // We'll create an API route to serve files
        s3Key: s3Key, // Store the S3 key for later use
      };
    } else {
      // Fallback to local storage (for development)
      const uploadDir = path.join(process.cwd(), "public", "uploads", uploadType);
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      
      await writeFile(filepath, processedBuffer);

      return {
        filename,
        originalName: file.originalname,
        mimeType: `image/${options?.format || "jpeg"}`,
        size: file.size,
        url: `/uploads/${uploadType}/${filename}`,
      };
    }
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error("Failed to process image");
  }
}

// Delete uploaded file
export async function deleteUploadedFile(
  uploadType: UploadType,
  filename: string
) {
  try {
    if (s3Client) {
      // Delete from S3
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: `${uploadType}/${filename}`,
      });
      await s3Client.send(command);
    } else {
      // Delete from local storage
      const filepath = path.join(
        process.cwd(),
        "public",
        "uploads",
        uploadType,
        filename
      );
      const { unlink } = await import("fs/promises");
      await unlink(filepath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete file");
  }
}

// Get file size in human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Validate file type
export function isValidImageType(mimeType: string): boolean {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  return validTypes.includes(mimeType);
}
