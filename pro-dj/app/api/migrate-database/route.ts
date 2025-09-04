import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    // Check for secret token to prevent unauthorized access
    const { token } = await req.json();
    const expectedToken = process.env.MIGRATION_SECRET_TOKEN;
    
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid migration token." },
        { status: 401 }
      );
    }

    console.log("Starting database migration...");
    
    // Run Prisma migrate deploy
    const { stdout, stderr } = await execAsync("npx prisma migrate deploy");
    
    console.log("Migration output:", stdout);
    if (stderr) {
      console.error("Migration stderr:", stderr);
    }

    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully",
      output: stdout,
      error: stderr || null,
    });

  } catch (error) {
    console.error("Migration error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}