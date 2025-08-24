import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

export async function GET() {
  try {
    console.log("🔍 Testing S3 configuration...");
    
    // Check environment variables
    const envCheck = {
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasRegion: !!process.env.AWS_REGION,
      hasBucket: !!process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET_NAME,
    };
    
    console.log("Environment check:", envCheck);
    
    if (!envCheck.hasAccessKey || !envCheck.hasSecretKey || !envCheck.hasRegion || !envCheck.hasBucket) {
      return NextResponse.json({
        ok: false,
        error: "Missing AWS environment variables",
        envCheck,
      }, { status: 500 });
    }
    
    // Test S3 client creation
    let s3Client: S3Client;
    try {
      s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      console.log("✅ S3 client created successfully");
    } catch (s3Error) {
      console.error("❌ S3 client creation failed:", s3Error);
      return NextResponse.json({
        ok: false,
        error: "S3 client creation failed",
        details: s3Error instanceof Error ? s3Error.message : "Unknown error",
      }, { status: 500 });
    }
    
    // Test Sharp
    try {
      const testBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // Minimal JPEG header
      const metadata = await sharp(testBuffer).metadata();
      console.log("✅ Sharp test successful:", metadata);
    } catch (sharpError) {
      console.error("❌ Sharp test failed:", sharpError);
      return NextResponse.json({
        ok: false,
        error: "Sharp processing failed",
        details: sharpError instanceof Error ? sharpError.message : "Unknown error",
      }, { status: 500 });
    }
    
    // Test S3 upload with a small test file
    try {
      const testKey = `test/upload-test-${Date.now()}.txt`;
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: testKey,
        Body: "Test upload from Pro-DJ app",
        ContentType: "text/plain",
      });
      
      await s3Client.send(command);
      console.log("✅ S3 upload test successful");
      
      return NextResponse.json({
        ok: true,
        message: "All S3 tests passed",
        envCheck,
        testUpload: {
          key: testKey,
          bucket: process.env.AWS_S3_BUCKET_NAME,
        },
      });
      
    } catch (uploadError) {
      console.error("❌ S3 upload test failed:", uploadError);
      return NextResponse.json({
        ok: false,
        error: "S3 upload test failed",
        details: uploadError instanceof Error ? uploadError.message : "Unknown error",
        envCheck,
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("Debug S3 error:", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
