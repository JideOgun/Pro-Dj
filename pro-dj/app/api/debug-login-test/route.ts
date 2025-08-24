import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    console.log("Debug login test for:", { email });
    
    // Step 1: Find user
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    console.log("User found:", !!user);
    
    if (!user) {
      return NextResponse.json({
        ok: false,
        step: "user_not_found",
        message: "User not found in database",
      });
    }

    console.log("User details:", {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password,
    });

    // Step 2: Check if user has password
    if (!user.password) {
      return NextResponse.json({
        ok: false,
        step: "no_password",
        message: "User has no password set",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }

    // Step 3: Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", passwordMatch);

    if (!passwordMatch) {
      return NextResponse.json({
        ok: false,
        step: "password_mismatch",
        message: "Password does not match",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }

    // Step 4: Success
    return NextResponse.json({
      ok: true,
      step: "success",
      message: "Login would succeed",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });

  } catch (error) {
    console.error("Debug login test error:", error);
    return NextResponse.json({
      ok: false,
      step: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
