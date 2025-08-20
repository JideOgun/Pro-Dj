import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { agreedToTerms, agreedToPrivacy } = await req.json();

    // Validate that both agreements are true
    if (!agreedToTerms || !agreedToPrivacy) {
      return NextResponse.json(
        { error: "Both Terms of Service and Privacy Policy must be agreed to" },
        { status: 400 }
      );
    }

    // Get current document versions (you can make this dynamic)
    const currentTermsVersion = "1.0.0";
    const currentPrivacyVersion = "1.0.0";

    // Update user with agreement information
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        agreedToTerms: true,
        agreedToPrivacy: true,
        termsAgreedAt: new Date(),
        privacyAgreedAt: new Date(),
        termsVersion: currentTermsVersion,
        privacyVersion: currentPrivacyVersion,
      },
      select: {
        id: true,
        email: true,
        agreedToTerms: true,
        agreedToPrivacy: true,
        termsAgreedAt: true,
        privacyAgreedAt: true,
        termsVersion: true,
        privacyVersion: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Terms and Privacy Policy agreement recorded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error recording terms agreement:", error);
    return NextResponse.json(
      { error: "Failed to record agreement" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's current agreement status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        agreedToTerms: true,
        agreedToPrivacy: true,
        termsAgreedAt: true,
        privacyAgreedAt: true,
        termsVersion: true,
        privacyVersion: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      agreements: user,
    });
  } catch (error) {
    console.error("Error fetching agreement status:", error);
    return NextResponse.json(
      { error: "Failed to fetch agreement status" },
      { status: 500 }
    );
  }
}
