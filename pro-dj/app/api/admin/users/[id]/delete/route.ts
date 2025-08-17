import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { handleDjTermination } from "@/lib/dj-termination";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { adminId, adminPassword } = await req.json();
    const userId = (await params).id;

    // Verify the admin is not trying to delete themselves
    if (userId === adminId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Validate admin password
    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password is required" },
        { status: 400 }
      );
    }

    // Get admin user to verify password
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      adminPassword,
      adminUser.password || ""
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid admin password" },
        { status: 401 }
      );
    }

    // Get the user to be deleted
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        djProfile: true,
        bookings: true,
        reviews: true,
      },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deletion of other admins (optional security measure)
    if (userToDelete.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete admin accounts" },
        { status: 400 }
      );
    }

    let terminationResult = null;

    // Handle DJ termination if the user is a DJ
    if (userToDelete.role === "DJ" && userToDelete.djProfile) {
      terminationResult = await handleDjTermination(
        userId,
        "Account terminated by admin",
        adminId
      );

      if (!terminationResult.success) {
        return NextResponse.json(
          {
            error: "Failed to process DJ termination",
            details: terminationResult.errors,
          },
          { status: 500 }
        );
      }
    }

    // Use a transaction to ensure all related data is deleted atomically
    await prisma.$transaction(async (tx) => {
      // Delete all reviews by this user
      await tx.review.deleteMany({
        where: { userId: userId },
      });

      // Delete all reviews for this user's bookings (if they're a DJ)
      if (userToDelete.djProfile) {
        await tx.review.deleteMany({
          where: {
            booking: {
              djId: userToDelete.djProfile.id,
            },
          },
        });
      }

      // Delete all bookings by this user (client bookings)
      await tx.booking.deleteMany({
        where: { userId: userId },
      });

      // Delete DJ profile if it exists
      if (userToDelete.djProfile) {
        await tx.djProfile.delete({
          where: { userId: userId },
        });
      }

      // Delete all notifications for this user
      await tx.notification.deleteMany({
        where: { userId: userId },
      });

      // Delete all booking recoveries for this user
      await tx.bookingRecovery.deleteMany({
        where: { userId: userId },
      });

      // Finally, delete the user account
      await tx.user.delete({
        where: { id: userId },
      });
    });

    const responseData: any = {
      success: true,
      message: "User account and all related data deleted successfully",
    };

    // Add termination details if it was a DJ
    if (terminationResult) {
      responseData.terminationDetails = {
        affectedBookings: terminationResult.affectedBookings,
        refundedBookings: terminationResult.refundedBookings,
        notificationsSent: terminationResult.notificationsSent,
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user account" },
      { status: 500 }
    );
  }
}
