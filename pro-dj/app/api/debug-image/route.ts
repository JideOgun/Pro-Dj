import { NextResponse } from "next/server";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    console.log("Debug image processing...");
    
    // Test Sharp availability
    console.log("Sharp version:", sharp.versions);
    
    // Test file system operations
    const testDir = path.join(process.cwd(), "public", "uploads", "test");
    console.log("Test directory:", testDir);
    
    try {
      await mkdir(testDir, { recursive: true });
      console.log("✅ Directory creation successful");
    } catch (dirError) {
      console.error("❌ Directory creation failed:", dirError);
      return NextResponse.json({
        ok: false,
        error: "Directory creation failed",
        details: dirError instanceof Error ? dirError.message : "Unknown error"
      }, { status: 500 });
    }
    
    // Test Sharp with a simple operation
    try {
      const testBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // Minimal JPEG header
      const metadata = await sharp(testBuffer).metadata();
      console.log("✅ Sharp metadata test successful:", metadata);
    } catch (sharpError) {
      console.error("❌ Sharp test failed:", sharpError);
      return NextResponse.json({
        ok: false,
        error: "Sharp processing failed",
        details: sharpError instanceof Error ? sharpError.message : "Unknown error"
      }, { status: 500 });
    }
    
    // Test file writing
    const testFile = path.join(testDir, "test.txt");
    try {
      await writeFile(testFile, "test content");
      console.log("✅ File writing test successful");
    } catch (writeError) {
      console.error("❌ File writing failed:", writeError);
      return NextResponse.json({
        ok: false,
        error: "File writing failed",
        details: writeError instanceof Error ? writeError.message : "Unknown error"
      }, { status: 500 });
    }
    
    return NextResponse.json({
      ok: true,
      message: "All image processing tests passed",
      environment: process.env.NODE_ENV,
      platform: process.platform,
    });
    
  } catch (error) {
    console.error("Debug image error:", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
