import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { adminId } = await req.json();

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Activate the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        status: "ACTIVE",
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null,
      },
    });

    // Create notification for the activated user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "ACCOUNT_ACTIVATED",
        title: "Account Activated",
        message:
          "Your account has been reactivated and you can now use the platform.",
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error activating user:", error);
    return NextResponse.json(
      { error: "Failed to activate user" },
      { status: 500 }
    );
  }
}
