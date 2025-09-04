import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDjAvailable } from "@/lib/booking-utils";

// POST - Admin assigns DJ to booking
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { id: bookingId } = params;
    const { djId, notes, action = "ASSIGNED" } = await req.json();

    const session = await getServerSession(authOptions);
    const adminId = session?.user?.id;

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin session required" },
        { status: 401 }
      );
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate DJ assignment
    if (djId) {
      const djProfile = await prisma.djProfile.findUnique({
        where: { id: djId },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      if (!djProfile) {
        return NextResponse.json({ error: "DJ not found" }, { status: 404 });
      }

      // Check if DJ is active subcontractor
      if (djProfile.contractorStatus !== "ACTIVE") {
        return NextResponse.json(
          {
            error: `DJ is not an active subcontractor (status: ${djProfile.contractorStatus})`,
          },
          { status: 400 }
        );
      }

      // Check DJ availability for this booking
      const { available, conflictingBookings } = await isDjAvailable(
        djId,
        booking.startTime,
        booking.endTime,
        booking.id
      );

      if (!available) {
        return NextResponse.json(
          {
            error: "DJ is not available for this time slot",
            conflictingBookings: conflictingBookings?.map((b: any) => ({
              id: b.id,
              eventType: b.eventType,
              startTime: b.startTime,
              endTime: b.endTime,
              clientName: b.user?.name || b.user?.email,
            })),
          },
          { status: 409 }
        );
      }
    }

    // Update booking with admin assignment
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        djId: djId || null,
        adminAssignedDjId: djId || null,
        adminApprovedBy: adminId,
        adminApprovedAt: new Date(),
        adminNotes: notes || null,
        status: djId ? "DJ_ASSIGNED" : "ADMIN_REVIEWING",
      },
    });

    // Create admin action record
    await prisma.adminBookingAction.create({
      data: {
        bookingId,
        adminId,
        action,
        reason: notes || null,
        newDjId: djId || null,
        previousDjId: booking.djId || null,
      },
    });

    // Get the updated booking with relations
    const finalBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: { name: true, email: true },
        },
        dj: {
          select: {
            stageName: true,
            user: { select: { name: true, email: true } },
          },
        },
        adminAssignedDj: {
          select: {
            stageName: true,
            user: { select: { name: true, email: true } },
          },
        },
        adminApprover: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: finalBooking,
      message: djId
        ? `Successfully assigned ${finalBooking?.dj?.stageName} to booking`
        : "Booking moved to admin review",
    });
  } catch (error) {
    console.error("Error assigning DJ to booking:", error);
    return NextResponse.json({ error: "Failed to assign DJ" }, { status: 500 });
  }
}

// PATCH - Update assignment or reassign DJ
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { id: bookingId } = params;
    const { djId, notes, action = "REASSIGNED" } = await req.json();

    const session = await getServerSession(authOptions);
    const adminId = session?.user?.id;

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin session required" },
        { status: 401 }
      );
    }

    // Get current booking
    const currentBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!currentBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const previousDjId = currentBooking.djId;

    // Same validation as POST
    if (djId) {
      const djProfile = await prisma.djProfile.findUnique({
        where: { id: djId },
      });

      if (!djProfile || djProfile.contractorStatus !== "ACTIVE") {
        return NextResponse.json(
          { error: "DJ not found or not active" },
          { status: 400 }
        );
      }

      const { available } = await isDjAvailable(
        djId,
        currentBooking.startTime,
        currentBooking.endTime,
        bookingId
      );

      if (!available) {
        return NextResponse.json(
          { error: "DJ is not available for this time slot" },
          { status: 409 }
        );
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        djId: djId || null,
        adminAssignedDjId: djId || null,
        adminApprovedBy: adminId,
        adminApprovedAt: new Date(),
        adminNotes: notes || null,
        status: djId ? "DJ_ASSIGNED" : "ADMIN_REVIEWING",
      },
    });

    // Record admin action
    await prisma.adminBookingAction.create({
      data: {
        bookingId,
        adminId,
        action,
        reason: notes || null,
        previousDjId,
        newDjId: djId || null,
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "DJ assignment updated successfully",
    });
  } catch (error) {
    console.error("Error updating DJ assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}
