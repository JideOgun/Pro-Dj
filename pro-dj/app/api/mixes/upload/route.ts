import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/aws";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  generateS3Key,
  isValidAudioFormat,
  isValidFileSize,
  getFileExtension,
} from "@/lib/aws";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireActiveSubscription } from "@/lib/subscription-guards";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";

// Check if user can upload based on actual mix count and subscription status
async function canUploadMix(
  userId: string
): Promise<{ canUpload: boolean; message: string }> {
  try {
    // Check if user has active subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const isActive =
      subscription &&
      (subscription.status === "ACTIVE" || subscription.status === "TRIAL");

    // If user has active subscription, they can upload unlimited
    if (isActive) {
      return { canUpload: true, message: "Active subscription" };
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === "ADMIN") {
      return { canUpload: true, message: "Admin access" };
    }

    // Count actual mixes for the user
    const mixCount = await prisma.djMix.count({
      where: {
        dj: {
          userId: userId,
        },
      },
    });

    console.log(`User ${userId} has ${mixCount} mixes, max free uploads: 2`);

    // Allow upload if under the limit
    if (mixCount < 2) {
      return {
        canUpload: true,
        message: `${2 - mixCount} free upload${
          2 - mixCount === 1 ? "" : "s"
        } remaining`,
      };
    }

    return {
      canUpload: false,
      message: "No free uploads remaining - subscription required",
    };
  } catch (error) {
    console.error("Error checking upload permission:", error);
    return { canUpload: false, message: "Error checking upload permission" };
  }
}

// Simple function to extract duration from audio file
const extractDuration = async (buffer: Buffer): Promise<number | null> => {
  try {
    // This is a simplified approach - in production you might want to use a proper audio library
    // For now, we'll return null and let the frontend handle it
    return null;
  } catch (error) {
    console.error("Error extracting duration:", error);
    return null;
  }
};

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimit(rateLimitConfigs.upload)(req);
  if (rateLimitResult) return rateLimitResult;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Only DJs and Admins can upload mixes" },
        { status: 403 }
      );
    }

    // Check upload permission for DJ users
    if (session.user.role === "DJ") {
      const uploadCheck = await canUploadMix(session.user.id);
      if (!uploadCheck.canUpload) {
        return NextResponse.json(
          { ok: false, error: uploadCheck.message },
          { status: 403 }
        );
      }
      console.log("Upload permission granted:", uploadCheck.message);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const albumArt = formData.get("albumArt") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const genre = formData.get("genre") as string;
    const tags = formData.get("tags") as string;
    const isPublic = formData.get("isPublic") === "true";

    // Parse genres from comma-separated string to array
    const genres = genre
      ? genre
          .split(",")
          .map((g) => g.trim())
          .filter((g) => g.length > 0)
      : [];

    console.log("Form data received:");
    console.log("- File:", file?.name, file?.size, file?.type);
    console.log("- Album Art:", albumArt?.name, albumArt?.size, albumArt?.type);
    console.log("- Title:", title);
    console.log("- Description:", description);
    console.log("- Genres:", genres);
    console.log("- Tags:", tags);
    console.log("- Is Public:", isPublic);

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    if (!isValidAudioFormat(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid audio format. Supported formats: MP3, WAV, OGG, M4A, AAC",
        },
        { status: 400 }
      );
    }

    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          ok: false,
          error: "File too large. Maximum size is 200MB",
        },
        { status: 400 }
      );
    }

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Check for duplicate uploads
    console.log("Checking for duplicate uploads...");
    console.log("File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    // Check for existing mix with same file name and size
    const existingMix = await prisma.djMix.findFirst({
      where: {
        djId: djProfile.id,
        fileName: file.name,
        fileSize: file.size,
        uploadStatus: "COMPLETED",
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
      },
    });

    if (existingMix) {
      console.log("Duplicate mix found:", existingMix);
      return NextResponse.json(
        {
          ok: false,
          error: "This file has already been uploaded",
          details: {
            existingMixId: existingMix.id,
            existingTitle: existingMix.title,
            uploadedAt: existingMix.createdAt,
          },
        },
        { status: 409 }
      );
    }

    // Additional check: Look for mixes with similar metadata (file size within 1% tolerance)
    const sizeTolerance = 0.01; // 1% tolerance
    const minSize = file.size * (1 - sizeTolerance);
    const maxSize = file.size * (1 + sizeTolerance);

    const similarMixes = await prisma.djMix.findMany({
      where: {
        djId: djProfile.id,
        fileSize: {
          gte: minSize,
          lte: maxSize,
        },
        uploadStatus: "COMPLETED",
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
      },
    });

    // Check if any of the similar mixes have the same file name
    const exactNameMatch = similarMixes.find(
      (mix) => mix.fileName === file.name
    );
    if (exactNameMatch) {
      console.log("Exact name match found:", exactNameMatch);
      return NextResponse.json(
        {
          ok: false,
          error: "A file with this name has already been uploaded",
          details: {
            existingMixId: exactNameMatch.id,
            existingTitle: exactNameMatch.title,
            uploadedAt: exactNameMatch.createdAt,
          },
        },
        { status: 409 }
      );
    }

    // Check for title similarity (case-insensitive)
    if (title) {
      const existingTitleMix = await prisma.djMix.findFirst({
        where: {
          djId: djProfile.id,
          title: {
            equals: title,
            mode: "insensitive",
          },
          uploadStatus: "COMPLETED",
        },
        select: {
          id: true,
          title: true,
          fileName: true,
          createdAt: true,
        },
      });

      if (existingTitleMix) {
        console.log("Title match found:", existingTitleMix);
        return NextResponse.json(
          {
            ok: false,
            error: "A mix with this title already exists",
            details: {
              existingMixId: existingTitleMix.id,
              existingTitle: existingTitleMix.title,
              uploadedAt: existingTitleMix.createdAt,
            },
          },
          { status: 409 }
        );
      }
    }

    console.log("No duplicates found, proceeding with upload...");

    // Generate file key
    const s3Key = generateS3Key(djProfile.id, file.name);

    // Check if AWS is configured
    console.log("AWS Configuration Check:");
    console.log(
      "- AWS_ACCESS_KEY_ID:",
      process.env.AWS_ACCESS_KEY_ID ? "SET" : "NOT SET"
    );
    console.log(
      "- AWS_SECRET_ACCESS_KEY:",
      process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "NOT SET"
    );
    console.log(
      "- AWS_S3_BUCKET_NAME:",
      process.env.AWS_S3_BUCKET_NAME || "DEFAULT"
    );
    console.log(
      "- AWS_CLOUDFRONT_DOMAIN:",
      process.env.AWS_CLOUDFRONT_DOMAIN || "NOT SET"
    );

    const awsConfigured =
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    console.log("AWS Configured:", awsConfigured);

    if (awsConfigured) {
      // Upload to S3 using streaming to avoid memory issues
      console.log("Uploading to S3:", {
        bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-production-files",
        key: s3Key,
        fileSize: file.size,
        contentType: file.type,
      });

      // Convert file to buffer in chunks to avoid memory issues
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadCommand = new PutObjectCommand({
                  Bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-production-files",
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
      });

      await s3Client.send(uploadCommand);

      // Clear the buffer from memory immediately
      buffer.fill(0);
    } else {
      // Save locally for development using streaming
      console.log("AWS not configured, saving locally:", s3Key);

      const uploadsDir = join(process.cwd(), "public", "uploads", "mixes");
      await mkdir(uploadsDir, { recursive: true });

      const filePath = join(uploadsDir, s3Key.split("/").pop() || file.name);

      // Use streaming to avoid memory issues
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filePath, buffer);

      // Clear the buffer from memory immediately
      buffer.fill(0);

      console.log("File saved locally:", filePath);
    }

    // Handle album art upload
    let albumArtS3Key = null;
    let albumArtUrl = null;

    console.log("About to process album art. albumArt exists:", !!albumArt);
    if (albumArt) {
      try {
        console.log("Processing album art upload...");
        console.log(
          "Album art file:",
          albumArt.name,
          "Size:",
          albumArt.size,
          "Type:",
          albumArt.type
        );

        const albumArtS3KeyName = generateS3Key(
          djProfile.id,
          `album_art_${Date.now()}_${albumArt.name}`
        );
        console.log("Generated album art S3 key:", albumArtS3KeyName);

        const albumArtArrayBuffer = await albumArt.arrayBuffer();
        const albumArtBuffer = Buffer.from(albumArtArrayBuffer);
        console.log("Album art buffer size:", albumArtBuffer.length);

        if (awsConfigured) {
          console.log("AWS configured, uploading to S3...");
          // Upload album art to S3
          const albumArtUploadCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-production-files",
            Key: albumArtS3KeyName,
            Body: albumArtBuffer,
            ContentType: albumArt.type,
          });
          await s3Client.send(albumArtUploadCommand);
          albumArtS3Key = albumArtS3KeyName;
          // Generate direct S3 URL if CloudFront is not available
          if (process.env.AWS_CLOUDFRONT_DOMAIN) {
            albumArtUrl = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${albumArtS3KeyName}`;
          } else {
            // Use direct S3 URL for now (you might want to generate a presigned URL for security)
            albumArtUrl = `https://${
              process.env.AWS_S3_BUCKET_NAME || "pro-dj-production-files"
            }.s3.${
              process.env.AWS_REGION || "us-east-2"
            }.amazonaws.com/${albumArtS3KeyName}`;
          }
          console.log("Album art uploaded to S3 successfully");
          console.log("Album art URL set to:", albumArtUrl);
        } else {
          console.log("AWS not configured, saving album art locally...");
          // Save album art locally
          const albumArtUploadsDir = join(
            process.cwd(),
            "public",
            "uploads",
            "album-art"
          );
          console.log("Album art uploads directory:", albumArtUploadsDir);

          try {
            await mkdir(albumArtUploadsDir, { recursive: true });
            console.log("Album art directory created/verified");

            // Extract just the filename part from the S3 key
            // S3 key structure: mixes/{djId}/{timestamp}_{filename}
            const albumArtFileName =
              albumArtS3KeyName.split("/")[3] || albumArt.name;
            console.log("Album art filename:", albumArtFileName);

            const albumArtFilePath = join(albumArtUploadsDir, albumArtFileName);
            console.log("Album art file path:", albumArtFilePath);

            await writeFile(albumArtFilePath, albumArtBuffer);
            console.log("Album art file saved successfully");

            albumArtS3Key = albumArtS3KeyName;
            albumArtUrl = `/uploads/album-art/${albumArtFileName}`;
            console.log("Album art URL set to:", albumArtUrl);
          } catch (localError) {
            console.error("Error saving album art locally:", localError);
            throw localError;
          }
        }
      } catch (albumArtError) {
        console.error("Error processing album art:", albumArtError);
        // Continue without album art rather than failing the entire upload
        albumArtS3Key = null;
        albumArtUrl = null;
      }
    }

    // Generate URLs for playback
    let cloudFrontUrl = null;
    let localUrl = null;

    if (awsConfigured) {
      cloudFrontUrl = process.env.AWS_CLOUDFRONT_DOMAIN
        ? `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${s3Key}`
        : null;
      // We'll set localUrl after mix creation since we need the mix ID
      localUrl = null;
    } else {
      // For local files, use direct path
      const fileName = s3Key.split("/").pop() || file.name;
      localUrl = `/uploads/mixes/${fileName}`;
    }

    // Create mix record in database
    console.log("Creating mix record in database with data:", {
      djId: djProfile.id,
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      description,
      genres,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      isPublic: isPublic || false,
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      format: getFileExtension(file.type),
      s3Key,
      cloudFrontUrl,
      localUrl,
      albumArtS3Key,
      albumArtUrl,
    });

    const mix = await prisma.djMix.create({
      data: {
        djId: djProfile.id,
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        description,
        genres,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        isPublic: isPublic || false,
        fileName: file.name,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        format: getFileExtension(file.type),
        s3Key,
        cloudFrontUrl,
        localUrl,
        albumArtS3Key,
        albumArtUrl,
        uploadStatus: "COMPLETED",
        uploadProgress: 100,
        uploadedAt: new Date(),
      },
      include: {
        dj: {
          select: {
            stageName: true,
            userId: true,
            user: {
              select: {
                profileImage: true,
              },
            },
          },
        },
      },
    });

    console.log("Mix created successfully:", mix.id);

    // Update localUrl with the correct mix ID if using AWS
    if (awsConfigured && !localUrl) {
      await prisma.djMix.update({
        where: { id: mix.id },
        data: {
          localUrl: `/api/mixes/stream?id=${mix.id}`,
        },
      });
      mix.localUrl = `/api/mixes/stream?id=${mix.id}`;
    }

    return NextResponse.json({
      ok: true,
      mix,
      message: "Mix uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading mix:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to upload mix",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
