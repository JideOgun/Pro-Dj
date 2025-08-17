import multer from "multer";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", uploadType);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileExtension = options?.format || "jpeg";
    const filename = `${uuidv4()}.${fileExtension}`;
    const filepath = path.join(uploadDir, filename);

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
    if (options?.format === "webp") {
      imageProcessor = imageProcessor.webp({ quality: options?.quality || 80 });
    } else if (options?.format === "png") {
      imageProcessor = imageProcessor.png({ quality: options?.quality || 80 });
    } else {
      imageProcessor = imageProcessor.jpeg({ quality: options?.quality || 80 });
    }

    // Save processed image
    await imageProcessor.toFile(filepath);

    // Return file metadata
    return {
      filename,
      originalName: file.originalname,
      mimeType: `image/${options?.format || "jpeg"}`,
      size: file.size,
      url: `/uploads/${uploadType}/${filename}`,
    };
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
    const filepath = path.join(
      process.cwd(),
      "public",
      "uploads",
      uploadType,
      filename
    );
    await writeFile(filepath, ""); // This will be replaced with proper deletion
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
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
