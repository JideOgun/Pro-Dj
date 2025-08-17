import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "DJ") {
      return NextResponse.json(
        { ok: false, error: "Only DJs can upload mixes" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const albumArt = formData.get("albumArt") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const genre = formData.get("genre") as string;
    const tags = formData.get("tags") as string;
    const isPublic = formData.get("isPublic") === "true";

    console.log("Form data received:");
    console.log("- File:", file?.name, file?.size, file?.type);
    console.log("- Album Art:", albumArt?.name, albumArt?.size, albumArt?.type);
    console.log("- Title:", title);
    console.log("- Description:", description);
    console.log("- Genre:", genre);
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

    // Generate file key
    const s3Key = generateS3Key(djProfile.id, file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
      // Upload to S3
      console.log("Uploading to S3:", {
        bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-mixes-v2",
        key: s3Key,
        fileSize: buffer.length,
        contentType: file.type,
      });

      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-mixes-v2",
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
      });

      await s3Client.send(uploadCommand);
    } else {
      // Save locally for development
      console.log("AWS not configured, saving locally:", s3Key);

      const uploadsDir = join(process.cwd(), "public", "uploads", "mixes");
      await mkdir(uploadsDir, { recursive: true });

      const filePath = join(uploadsDir, s3Key.split("/").pop() || file.name);
      await writeFile(filePath, buffer);

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
            Bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-mixes-v2",
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
              process.env.AWS_S3_BUCKET_NAME || "pro-dj-mixes-v2"
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
      localUrl = `/api/mixes/stream?key=${encodeURIComponent(s3Key)}`;
    } else {
      // For local files, use direct path
      const fileName = s3Key.split("/").pop() || file.name;
      localUrl = `/uploads/mixes/${fileName}`;
    }

    // Create mix record in database
    const mix = await prisma.djMix.create({
      data: {
        djId: djProfile.id,
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        description,
        genre,
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
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      mix,
      message: "Mix uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading mix:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to upload mix",
      },
      { status: 500 }
    );
  }
}
