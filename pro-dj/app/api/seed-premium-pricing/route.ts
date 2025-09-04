import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    // Check for secret token to prevent unauthorized access
    const { token } = await req.json().catch(() => ({}));
    const expectedToken = process.env.MIGRATION_SECRET_TOKEN;
    
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid seed token." },
        { status: 401 }
      );
    }

    console.log("Starting premium pricing seed...");
    
    // Run the seed script
    const { stdout, stderr } = await execAsync("npx tsx prisma/seed-premium-pricing.ts");
    
    console.log("Seed output:", stdout);
    if (stderr) {
      console.error("Seed errors:", stderr);
    }

    return NextResponse.json({
      success: true,
      message: "Premium pricing seeded successfully",
      output: stdout,
      errors: stderr || null,
    });

  } catch (error) {
    console.error("Seed error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
