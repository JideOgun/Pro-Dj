import { NextResponse } from "next/server";
import {
  generatePresignedUploadUrl,
  generateS3Key,
  S3_BUCKET_NAME,
} from "@/lib/aws";

export async function GET() {
  try {
    // Test presigned URL generation
    const s3Key = generateS3Key("test-dj-id", "test-file.mp3");
    const presignedUrl = await generatePresignedUploadUrl(s3Key, "audio/mpeg");

    return NextResponse.json({
      ok: true,
      s3Key,
      presignedUrl,
      bucketName: S3_BUCKET_NAME,
      region: process.env.AWS_REGION || "us-east-2",
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    });
  } catch (error) {
    console.error("S3 Debug Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        bucketName: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      },
      { status: 500 }
    );
  }
}
