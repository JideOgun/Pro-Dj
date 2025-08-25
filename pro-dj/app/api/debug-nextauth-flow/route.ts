import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("🔍 Debugging NextAuth flow for:", email);

    // Step 1: Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT_SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log("Environment check:", envCheck);

    // Step 2: Simulate exact NextAuth authorize function
    console.log("Step 2: Simulating NextAuth authorize function...");

    if (!email || !password) {
      console.log("❌ Missing credentials");
      return NextResponse.json(
        {
          success: false,
          error: "Missing credentials",
          step: "credentials_check",
        },
        { status: 400 }
      );
    }

    console.log("Credentials provided:", { email, hasPassword: !!password });

    // Step 3: Find user (exact NextAuth query)
    console.log("Step 3: Finding user...");
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          step: "user_lookup",
          envCheck,
        },
        { status: 401 }
      );
    }

    console.log("✅ User found:", {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password,
    });

    // Step 4: Check password
    if (!user.password) {
      console.log("❌ User has no password");
      return NextResponse.json(
        {
          success: false,
          error: "User has no password",
          step: "password_check",
          envCheck,
        },
        { status: 401 }
      );
    }

    // Step 5: Verify password (exact NextAuth logic)
    console.log("Step 5: Verifying password...");
    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log("Password comparison result:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ Password verification failed");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid password",
          step: "password_verification",
          envCheck,
        },
        { status: 401 }
      );
    }

    console.log("✅ Password verified successfully");

    // Step 6: Return user object (exact NextAuth format)
    const userObject = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    console.log("✅ NextAuth user object:", userObject);

    return NextResponse.json({
      success: true,
      message: "NextAuth flow simulation successful",
      user: userObject,
      envCheck,
      step: "success",
    });
  } catch (error) {
    console.error("❌ Error in NextAuth flow debug:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        step: "exception",
      },
      { status: 500 }
    );
  }
}
