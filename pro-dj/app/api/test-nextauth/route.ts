import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing NextAuth session...");

    // Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT_SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log("Environment check:", envCheck);

    // Try to get session
    const session = await getServerSession(authOptions);

    console.log("Session result:", session ? "FOUND" : "NOT_FOUND");

    if (session) {
      console.log("Session details:", {
        user: session.user?.email,
        role: session.user?.role,
        status: session.user?.status,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      session: session
        ? {
            exists: true,
            user: {
              id: session.user?.id,
              email: session.user?.email,
              name: session.user?.name,
              role: session.user?.role,
              status: session.user?.status,
            },
          }
        : {
            exists: false,
            user: null,
          },
      message: "NextAuth session test completed",
    });
  } catch (error) {
    console.error("❌ Error in NextAuth test:", error);
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
