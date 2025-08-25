import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debugging authentication issues...");

    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    };

    console.log("Environment check:", envCheck);

    // Test database connection
    let dbConnection = "FAILED";
    let userCount = 0;
    let adminUser = null;

    try {
      // Test basic database connection
      await prisma.$queryRaw`SELECT 1`;
      dbConnection = "SUCCESS";

      // Count users
      userCount = await prisma.user.count();

      // Check for admin user
      adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          hasPassword: true,
        },
      });

      // Check all users
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      });

      console.log("Database connection successful");
      console.log("User count:", userCount);
      console.log("Admin user:", adminUser);
      console.log("All users:", allUsers);

    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      dbConnection = "FAILED";
    }

    // Test password hashing
    let passwordTest = "FAILED";
    try {
      const testPassword = "test123";
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      const isValid = await bcrypt.compare(testPassword, hashedPassword);
      passwordTest = isValid ? "SUCCESS" : "FAILED";
    } catch (passwordError) {
      console.error("Password test failed:", passwordError);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connection: dbConnection,
        userCount,
        adminUser,
      },
      passwordTest,
      message: "Authentication debug information",
    });

  } catch (error) {
    console.error("❌ Error in auth debug:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
