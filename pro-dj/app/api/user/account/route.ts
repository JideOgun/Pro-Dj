import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Pause account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { action, password } = await req.json();

    if (action === "pause") {
      // Verify password for pause action
      if (!password) {
        return NextResponse.json(
          { error: "Password is required" },
          { status: 400 }
        );
      }

      // Verify password
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { password: true },
      });

      if (!user?.password) {
        return NextResponse.json(
          { error: "User not found or no password set" },
          { status: 404 }
        );
      }

      const bcrypt = require("bcryptjs");
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }

      // Pause the account
      const updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: {
          status: "SUSPENDED",
          suspendedAt: new Date(),
          suspendedBy: session.user.id, // User paused themselves
          suspensionReason: "Self-paused",
        },
        select: {
          id: true,
          email: true,
          status: true,
          suspendedAt: true,
          suspendedBy: true,
          suspensionReason: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Account paused successfully",
        user: updatedUser,
      });
    }

    if (action === "reactivate") {
      // Reactivate the account
      const updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: {
          status: "ACTIVE",
          suspendedAt: null,
          suspendedBy: null,
          suspensionReason: null,
        },
        select: {
          id: true,
          email: true,
          status: true,
          suspendedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Account reactivated successfully",
        user: updatedUser,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing account:", error);
    return NextResponse.json(
      { error: "Failed to manage account" },
      { status: 500 }
    );
  }
}

// Delete account
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get password from request body
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "User not found or no password set" },
        { status: 404 }
      );
    }

    const bcrypt = require("bcryptjs");
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Check if user has active bookings
    const activeBookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ["PENDING_ADMIN_REVIEW", "ADMIN_REVIEWING", "DJ_ASSIGNED", "CONFIRMED"],
        },
      },
    });

    if (activeBookings.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete account with active bookings. Please cancel or complete all bookings first.",
          activeBookingsCount: activeBookings.length,
        },
        { status: 400 }
      );
    }

    // Delete user and all associated data
    await prisma.$transaction(async (tx) => {
      // Delete user's bookings
      await tx.booking.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete user's comments
      await tx.comment.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete user's comment likes/dislikes
      await tx.commentLike.deleteMany({
        where: { userId: session.user.id },
      });

      await tx.commentDislike.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete user's reviews
      await tx.review.deleteMany({
        where: { clientId: session.user.id },
      });

      // Delete user's notifications
      await tx.notification.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete user's media
      await tx.userMedia.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete user's follows
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: session.user.id },
            { followingId: session.user.id },
          ],
        },
      });

      // Delete user's reposts
      await tx.repost.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete user's mix likes
      await tx.mixLike.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete DJ profile if exists
      await tx.djProfile.deleteMany({
        where: { userId: session.user.id },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: session.user.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

// Get account status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        status: true,
        suspendedAt: true,
        suspendedBy: true,
        suspensionReason: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        userId: user.id,
        status: {
          in: ["PENDING_ADMIN_REVIEW", "ADMIN_REVIEWING", "DJ_ASSIGNED", "CONFIRMED"],
        },
      },
    });

    return NextResponse.json({
      success: true,
      user,
      activeBookingsCount: activeBookings,
    });
  } catch (error) {
    console.error("Error fetching account status:", error);
    return NextResponse.json(
      { error: "Failed to fetch account status" },
      { status: 500 }
    );
  }
}
