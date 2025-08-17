import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reason, adminId } = await req.json();

    if (!reason || !adminId) {
      return NextResponse.json(
        { error: "Reason and admin ID are required" },
        { status: 400 }
      );
    }

    // Check if user exists and is a DJ
    const user = await prisma.user.findUnique({
      where: { id: id },
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

    // Reject the DJ and change role back to CLIENT
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        status: "ACTIVE",
        role: "CLIENT", // Change back to client
      },
    });

    // Delete the DJ profile
    await prisma.djProfile.delete({
      where: { userId: id },
    });

    // Create notification for the rejected DJ
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "DJ_REJECTED",
        title: "DJ Profile Rejected",
        message: `Your DJ profile has been rejected. Reason: ${reason}. You can still use the platform as a client.`,
        isRead: false,
      },
    });

    // Log the admin action
    console.log(
      `Admin ${adminId} rejected DJ ${user.djProfile?.stageName} (${user.email}). Reason: ${reason}`
    );

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error rejecting DJ:", error);
    return NextResponse.json({ error: "Failed to reject DJ" }, { status: 500 });
  }
}
