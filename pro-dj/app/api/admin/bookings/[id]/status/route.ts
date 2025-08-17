import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, reason, adminId } = await req.json();

    if (!status || !reason || !adminId) {
      return NextResponse.json(
        { error: "Status, reason, and admin ID are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      "PENDING",
      "ACCEPTED",
      "CONFIRMED",
      "DECLINED",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        dj: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const oldStatus = booking.status;

    // Update the booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: status as
          | "PENDING"
          | "ACCEPTED"
          | "CONFIRMED"
          | "DECLINED"
          | "CANCELLED",
      },
    });

    // Create notification for the client
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: "BOOKING_STATUS_CHANGED",
        title: "Booking Status Updated",
        message: `Your booking for ${booking.eventType} has been updated to ${status}. Reason: ${reason}`,
        isRead: false,
      },
    });

    // Create notification for the DJ if assigned
    if (booking.djId && booking.dj) {
      await prisma.notification.create({
        data: {
          userId: booking.dj.userId,
          type: "BOOKING_STATUS_CHANGED",
          title: "Booking Status Updated",
          message: `A booking you're assigned to (${booking.eventType}) has been updated to ${status}. Reason: ${reason}`,
          isRead: false,
        },
      });
    }

    // Log the admin action
    console.log(
      `Admin ${adminId} changed booking ${params.id} status from ${oldStatus} to ${status}. Reason: ${reason}`
    );

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}
