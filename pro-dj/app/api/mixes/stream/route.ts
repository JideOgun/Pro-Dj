import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function OPTIONS(req: NextRequest) {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Range, Accept-Ranges, Content-Range"
  );

  return new NextResponse(null, { status: 200, headers });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const mixId = searchParams.get("id");

    if (!mixId) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }

    // Find the mix to check permissions
    const mix = await prisma.djMix.findFirst({
      where: { id: mixId },
      include: {
        dj: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!mix) {
      return NextResponse.json({ error: "Mix not found" }, { status: 404 });
    }

    // Check if user has permission to access this mix
    if (!mix.isPublic) {
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Allow access if user is the DJ who uploaded it or an admin
      if (session.user.role !== "ADMIN" && mix.dj.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get the file from S3
    const command = new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-production-files",
      Key: mix.s3Key,
    });

    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("S3 request timeout")), 30000); // 30 second timeout
    });

    const response = (await Promise.race([
      s3Client.send(command),
      timeoutPromise,
    ])) as any;

    if (!response.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Handle range requests for seeking
    const range = req.headers.get("range");
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1]
        ? parseInt(parts[1], 10)
        : (response.ContentLength || 0) - 1;

      // Create a new command with range
      const rangeCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-production-files",
        Key: mix.s3Key,
        Range: `bytes=${start}-${end}`,
      });

      const rangeResponse = await s3Client.send(rangeCommand);

      if (!rangeResponse.Body) {
        return NextResponse.json(
          { error: "Range not available" },
          { status: 416 }
        );
      }

      const headers = new Headers();
      headers.set("Content-Type", mix.mimeType);
      headers.set(
        "Content-Range",
        `bytes ${start}-${end}/${response.ContentLength || 0}`
      );
      headers.set("Content-Length", (end - start + 1).toString());
      headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("ETag", response.ETag || "");
      headers.set("Last-Modified", response.LastModified?.toUTCString() || "");
      headers.set("Vary", "Accept-Encoding");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      headers.set(
        "Access-Control-Allow-Headers",
        "Range, Accept-Ranges, Content-Range"
      );

      // Stream the range directly
      return new NextResponse(rangeResponse.Body as any, {
        status: 206,
        headers,
      });
    }

    // For full file requests, stream directly without loading into memory
    const headers = new Headers();
    headers.set("Content-Type", mix.mimeType);
    headers.set("Content-Length", (response.ContentLength || 0).toString());
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("ETag", response.ETag || "");
    headers.set("Last-Modified", response.LastModified?.toUTCString() || "");

    // Enable compression for better performance
    headers.set("Vary", "Accept-Encoding");

    // Add CORS headers for browser compatibility
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "Range, Accept-Ranges, Content-Range"
    );

    // Increment play count (only for full requests, not range requests)
    await prisma.djMix.update({
      where: { id: mix.id },
      data: {
        playCount: { increment: 1 },
        lastPlayedAt: new Date(),
      },
    });

    // Stream the file directly from S3
    return new NextResponse(response.Body as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    let errorMessage = "Failed to stream mix";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorMessage = "Request timed out";
        statusCode = 408;
      } else if (error.message.includes("NoSuchKey")) {
        errorMessage = "Audio file not found";
        statusCode = 404;
      } else if (error.message.includes("AccessDenied")) {
        errorMessage = "Access denied to audio file";
        statusCode = 403;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
