import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 Running database migration...");

    // Check if resetToken column exists
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('resetToken', 'resetTokenExpiry')
    `;

    console.log("Current User table columns:", tableInfo);

    // Add resetToken column if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT`;
      console.log("✅ Added resetToken column");
    } catch (error) {
      console.log("resetToken column already exists or error:", error);
    }

    // Add resetTokenExpiry column if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP`;
      console.log("✅ Added resetTokenExpiry column");
    } catch (error) {
      console.log("resetTokenExpiry column already exists or error:", error);
    }

    // Verify the columns exist
    const updatedTableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('resetToken', 'resetTokenExpiry')
    `;

    console.log("Updated User table columns:", updatedTableInfo);

    // Test a simple query to make sure everything works
    const userCount = await prisma.user.count();
    console.log("✅ Database migration completed. User count:", userCount);

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully",
      userCount,
      columnsAdded: updatedTableInfo
    });

  } catch (error) {
    console.error("❌ Error in database migration:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
