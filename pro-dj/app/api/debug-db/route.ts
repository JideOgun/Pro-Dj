import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: {
        email: "jideogun93@gmail.com",
        role: "ADMIN"
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        password: true,
      }
    });

    // Count total users
    const totalUsers = await prisma.user.count();

    return NextResponse.json({
      ok: true,
      database: {
        connected: true,
        totalUsers,
        adminUser: adminUser ? {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          status: adminUser.status,
          hasPassword: !!adminUser.password
        } : null,
      },
      message: "Database connection successful",
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      database: {
        connected: false,
      },
      message: "Database connection failed",
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
