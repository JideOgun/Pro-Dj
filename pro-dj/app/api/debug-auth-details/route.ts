import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Starting detailed auth debug...");

    // Environment variables check
    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT_SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT_SET",
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    };

    // Database connection test
    let database = {
      connection: "UNKNOWN",
      userCount: 0,
      adminUser: null,
      connectionError: null,
    };

    try {
      // Test basic connection
      await prisma.$queryRaw`SELECT 1`;
      database.connection = "SUCCESS";
      
      // Count users
      const userCount = await prisma.user.count();
      database.userCount = userCount;

      // Find admin user
      const adminUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: process.env.ADMIN_EMAIL },
            { role: "ADMIN" }
          ]
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          password: true, // Include password for debugging
        }
      });

      database.adminUser = adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        status: adminUser.status,
        hasPassword: !!adminUser.password,
        passwordLength: adminUser.password?.length || 0,
      } : null;

    } catch (dbError) {
      database.connection = "FAILED";
      database.connectionError = dbError instanceof Error ? dbError.message : "Unknown error";
    }

    // Password test
    let passwordTest = "UNKNOWN";
    try {
      if (process.env.ADMIN_PASSWORD && database.adminUser) {
        // Test password hashing
        const testHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        passwordTest = "SUCCESS";
      } else {
        passwordTest = "SKIPPED - No password or admin user";
      }
    } catch (pwError) {
      passwordTest = "FAILED";
    }

    // Test NextAuth configuration
    let nextAuthTest = "UNKNOWN";
    try {
      if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL) {
        nextAuthTest = "CONFIGURED";
      } else {
        nextAuthTest = "MISSING_CONFIG";
      }
    } catch (authError) {
      nextAuthTest = "ERROR";
    }

    console.log("✅ Detailed auth debug completed");

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment,
      database,
      passwordTest,
      nextAuthTest,
      message: "Detailed authentication debug information",
    });
  } catch (error) {
    console.error("❌ Error in detailed auth debug:", error);
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
