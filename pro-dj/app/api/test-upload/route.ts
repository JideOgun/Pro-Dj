import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePresignedUploadUrl, generateS3Key } from "@/lib/aws";

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

    const { fileName, fileSize, mimeType } = await req.json();

    // Test with a simple text file
    const testFileName = "test-upload.txt";
    const testFileSize = 100; // 100 bytes
    const testMimeType = "text/plain";

    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ profile not found" },
        { status: 404 }
      );
    }

    const s3Key = generateS3Key(djProfile.id, testFileName);
    const presignedUrl = await generatePresignedUploadUrl(s3Key, testMimeType);

    return NextResponse.json({
      ok: true,
      uploadUrl: presignedUrl,
      s3Key,
      message: "Test upload URL generated successfully",
    });
  } catch (error) {
    console.error("Error generating test upload URL:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

