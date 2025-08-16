import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if user exists and is a DJ
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        djProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "DJ") {
      return NextResponse.json({ error: "User is not a DJ" }, { status: 400 });
    }

    if (user.status !== "PENDING") {
      return NextResponse.json(
        { error: "DJ is not pending approval" },
        { status: 400 }
      );
    }

    // Approve the DJ
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        status: "ACTIVE",
      },
    });

    // Update DJ profile to verified
    await prisma.djProfile.update({
      where: { userId: params.id },
      data: {
        isVerified: true,
      },
    });

    // Create notification for the approved DJ
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "DJ_APPROVED",
        title: "DJ Profile Approved",
        message: `Congratulations! Your DJ profile has been approved. You can now receive booking requests.`,
        isRead: false,
      },
    });

    // Log the admin action
    console.log(
      `Admin ${adminId} approved DJ ${user.djProfile?.stageName} (${user.email})`
    );

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error approving DJ:", error);
    return NextResponse.json(
      { error: "Failed to approve DJ" },
      { status: 500 }
    );
  }
}
