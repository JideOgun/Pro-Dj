import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    if (!s3Client) {
      return NextResponse.json(
        { error: "S3 not configured" },
        { status: 500 }
      );
    }

    // Join the key parts back together
    const s3Key = params.key.join("/");

    // Generate presigned URL for the file
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Redirect to the presigned URL
    return NextResponse.redirect(presignedUrl);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
