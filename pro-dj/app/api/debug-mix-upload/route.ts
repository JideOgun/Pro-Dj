import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/aws";

export async function GET() {
  try {
    console.log("🔍 Testing mix upload configuration...");
    
    // Test 1: Check environment variables
    const envCheck = {
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasRegion: !!process.env.AWS_REGION,
      hasBucket: !!process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET_NAME,
    };
    
    console.log("Environment check:", envCheck);
    
    // Test 2: Check S3 client
    if (!s3Client) {
      return NextResponse.json({
        ok: false,
        error: "S3 client not configured",
        envCheck,
      }, { status: 500 });
    }
    
    console.log("✅ S3 client configured");
    
    // Test 3: Check database connection
    try {
      await prisma.$connect();
      console.log("✅ Database connected");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return NextResponse.json({
        ok: false,
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : "Unknown error",
        envCheck,
      }, { status: 500 });
    }
    
    // Test 4: Check if user exists
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        ok: false,
        error: "No authenticated user",
        envCheck,
      }, { status: 401 });
    }
    
    console.log("✅ User authenticated:", session.user.email);
    
    // Test 5: Check if DJ profile exists
    const djProfile = await prisma.djProfile.findFirst({
      where: { userId: session.user.id },
    });
    
    if (!djProfile) {
      return NextResponse.json({
        ok: false,
        error: "No DJ profile found",
        user: session.user.email,
        envCheck,
      }, { status: 404 });
    }
    
    console.log("✅ DJ profile found:", djProfile.id);
    
    return NextResponse.json({
      ok: true,
      message: "All mix upload tests passed",
      user: session.user.email,
      djProfile: {
        id: djProfile.id,
        stageName: djProfile.stageName,
      },
      envCheck,
    });
    
  } catch (error) {
    console.error("Debug mix upload error:", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
