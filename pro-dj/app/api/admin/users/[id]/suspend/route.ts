import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleDjTermination } from "@/lib/dj-termination";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string  } }
) {
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        djProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from suspending themselves
    if (user.id === adminId) {
      return NextResponse.json(
        { error: "Cannot suspend your own account" },
        { status: 400 }
      );
    }

    // Prevent admin from suspending other admins
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot suspend other admin accounts" },
        { status: 400 }
      );
    }

    let terminationResult = null;

    // Handle DJ suspension if the user is a DJ
    if (user.role === "DJ" && user.djProfile) {
      terminationResult = await handleDjTermination(
        params.id,
        `Account suspended: ${reason}`,
        adminId
      );

      if (!terminationResult.success) {
        return NextResponse.json(
          {
            error: "Failed to process DJ suspension",
            details: terminationResult.errors,
          },
          { status: 500 }
        );
      }
    }

    // Suspend the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        status: "SUSPENDED",
        suspendedAt: new Date(),
        suspendedBy: adminId,
        suspensionReason: reason,
      },
    });

    // Create notification for the suspended user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "ACCOUNT_SUSPENDED",
        title: "Account Suspended",
        message: `Your account has been suspended. Reason: ${reason}`,
        isRead: false,
      },
    });

    const responseData: any = {
      success: true,
      user: updatedUser,
    };

    // Add suspension details if it was a DJ
    if (terminationResult) {
      responseData.suspensionDetails = {
        affectedBookings: terminationResult.affectedBookings,
        refundedBookings: terminationResult.refundedBookings,
        notificationsSent: terminationResult.notificationsSent,
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error suspending user:", error);
    return NextResponse.json(
      { error: "Failed to suspend user" },
      { status: 500 }
    );
  }
}
