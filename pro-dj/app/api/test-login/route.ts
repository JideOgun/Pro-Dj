import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log("🔍 Testing login for:", email);

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email and password required"
      }, { status: 400 });
    }

    // Step 1: Find user
    console.log("Step 1: Finding user...");
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json({
        success: false,
        error: "User not found",
        step: "user_lookup"
      }, { status: 401 });
    }

    console.log("✅ User found:", user.email, "Role:", user.role, "Status:", user.status);

    // Step 2: Check if user has password
    if (!user.password) {
      console.log("❌ User has no password");
      return NextResponse.json({
        success: false,
        error: "User has no password set",
        step: "password_check"
      }, { status: 401 });
    }

    console.log("✅ User has password, length:", user.password.length);

    // Step 3: Verify password
    console.log("Step 3: Verifying password...");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log("❌ Password verification failed");
      return NextResponse.json({
        success: false,
        error: "Invalid password",
        step: "password_verification"
      }, { status: 401 });
    }

    console.log("✅ Password verified successfully");

    // Step 4: Check user status
    if (user.status !== "ACTIVE") {
      console.log("❌ User status not active:", user.status);
      return NextResponse.json({
        success: false,
        error: "User account is not active",
        step: "status_check"
      }, { status: 401 });
    }

    console.log("✅ User status is active");

    // Step 5: Success
    console.log("🎉 Login test successful!");
    return NextResponse.json({
      success: true,
      message: "Login test successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error("❌ Error in test login:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      step: "exception"
    }, { status: 500 });
  }
}
