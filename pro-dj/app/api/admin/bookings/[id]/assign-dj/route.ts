import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { isDjAvailable } from "@/lib/booking-utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ ok: false, error: gate.error }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const djId = body.djId ? String(body.djId).trim() : null;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      dj: { select: { stageName: true } },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { ok: false, error: "Booking not found" },
      { status: 404 }
    );
  }

  // If DJ is being assigned, check for conflicts
  if (djId && booking.startTime && booking.endTime) {
    const { available, conflictingBookings } = await isDjAvailable(
      djId,
      booking.startTime,
      booking.endTime,
      booking.id // Exclude current booking from conflict check
    );

    if (!available) {
      return NextResponse.json(
        {
          ok: false,
          error: "Selected DJ is not available for this time slot",
          conflictingBookings: (
            conflictingBookings as Array<{
              id: string;
              startTime: Date;
              endTime: Date;
              eventType: string;
              user?: { name?: string; email?: string };
            }>
          ).map((b) => ({
            id: b.id,
            startTime: b.startTime,
            endTime: b.endTime,
            eventType: b.eventType,
            clientName: b.user?.name || b.user?.email,
          })),
        },
        { status: 409 }
      );
    }

    // Verify DJ is active (Stripe Connect no longer required for assignment)
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: djId },
      select: {
        contractorStatus: true,
        stageName: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!djProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ not found" },
        { status: 404 }
      );
    }

    if (djProfile.contractorStatus !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: "DJ is not active" },
        { status: 400 }
      );
    }

    // Note: Stripe Connect setup is no longer required for DJ assignment
    // DJs will be paid later through manual disbursement by Pro-DJ
  }

  // Update the booking with the new DJ assignment
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      djId: djId,
      adminAssignedDjId: djId,
      // If this is the first DJ assignment, update status to DJ_ASSIGNED
      ...(booking.status === "PENDING_ADMIN_REVIEW" &&
        djId && {
          status: "DJ_ASSIGNED",
        }),
    },
    include: {
      dj: {
        select: {
          stageName: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      preferredDj: {
        select: {
          stageName: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Prepare detailed response
  const assignedDJ = djId ? updated.dj : null;
  const wasRequested = djId && updated.preferredDjId === djId;

  return NextResponse.json({
    ok: true,
    data: updated,
    message: djId
      ? `DJ ${
          assignedDJ?.stageName || assignedDJ?.user.name
        } assigned successfully${
          wasRequested ? " (as requested by client)" : ""
        }`
      : "DJ assignment removed",
    assignment: {
      djId: djId,
      djName: assignedDJ?.stageName || assignedDJ?.user.name,
      djEmail: assignedDJ?.user.email,
      wasRequested: wasRequested,
      statusChanged: booking.status !== updated.status,
      newStatus: updated.status,
    },
  });
}
