import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BOOKING_CONFIG } from "@/lib/booking-config";
import {
  validateBookingTime,
  isDjAvailable,
  getAvailableDjs,
  checkEventTimeConflicts,
} from "@/lib/booking-utils";

// GET admin and DJ: list bookings
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow ADMIN and DJ users to access bookings
  if (session.user.role !== "ADMIN" && session.user.role !== "DJ") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build the query based on user role
  let whereClause = {};

  if (session.user.role === "ADMIN") {
    // Admin sees all bookings
    whereClause = {};
  } else if (session.user.role === "DJ") {
    // DJ sees only their bookings - need to get their DJ profile first
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (djProfile) {
      whereClause = { djId: djProfile.id };
    } else {
      // If no DJ profile found, show no bookings
      whereClause = { djId: null };
    }
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      dj: { select: { stageName: true } },
    },
  });

  return NextResponse.json({ bookings });
}

// Post (public - create booking request)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("User role:", session.user.role);

    // Restrict booking creation to CLIENT users only
    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { ok: false, error: "Only clients can create booking requests" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    console.log("Request body:", body);

    const bookingType = String(body?.bookingType ?? "").trim();
    const packageKey = String(body?.packageKey ?? "").trim();
    const eventDate = String(body?.eventDate ?? "").trim();
    const startTime = String(body?.startTime ?? "").trim();
    const endTime = String(body?.endTime ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const djId = body?.djId ? String(body.djId).trim() : null;
    const extra = body?.extra ?? null; // optional future use

    console.log("Parsed values:", {
      bookingType,
      packageKey,
      eventDate,
      startTime,
      endTime,
      message,
      djId,
    });

    if (
      !bookingType ||
      !packageKey ||
      !eventDate ||
      !startTime ||
      !endTime ||
      !message
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Look up the package in DB (single source of truth)
    const pkg = await prisma.pricing.findFirst({
      where: { type: bookingType, key: packageKey, isActive: true },
      select: { priceCents: true, label: true },
    });
    console.log("Package found:", pkg);

    if (!pkg) {
      return NextResponse.json(
        { ok: false, error: "Invalid type or package" },
        { status: 400 }
      );
    }

    // Parse and validate times
    const eventDateTime = new Date(eventDate + "T00:00:00");

    // Parse start and end times more carefully to avoid timezone issues
    let startDateTime: Date;
    let endDateTime: Date;

    try {
      // If startTime already includes the date, use it as is
      if (startTime.includes("T") && startTime.includes("-")) {
        startDateTime = new Date(startTime);
      } else {
        // Otherwise, combine with event date
        startDateTime = new Date(`${eventDate}T${startTime}:00`);
      }

      if (endTime.includes("T") && endTime.includes("-")) {
        endDateTime = new Date(endTime);
      } else {
        endDateTime = new Date(`${eventDate}T${endTime}:00`);
      }
    } catch (error) {
      console.error("Date parsing error:", error);
      return NextResponse.json(
        { ok: false, error: "Invalid date/time format" },
        { status: 400 }
      );
    }

    console.log("Parsed dates:", {
      eventDateTime,
      startDateTime,
      endDateTime,
      originalStartTime: startTime,
      originalEndTime: endTime,
    });

    // Validate booking time
    const timeValidation = validateBookingTime(startDateTime, endDateTime);
    console.log("Time validation:", timeValidation);

    if (!timeValidation.valid) {
      return NextResponse.json(
        { ok: false, error: timeValidation.error },
        { status: 400 }
      );
    }

    // Check for event-level time conflicts (prevents overlapping DJ time slots)
    const {
      hasConflicts: eventTimeConflicts,
      conflictingBookings: eventTimeConflictingBookings,
    } = await checkEventTimeConflicts(
      eventDateTime,
      startDateTime,
      endDateTime
    );

    console.log("Event time conflicts:", {
      eventTimeConflicts,
      eventTimeConflictingBookings,
    });

    if (eventTimeConflicts) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This time slot conflicts with another DJ booking for the same event",
          conflictingBookings: (
            eventTimeConflictingBookings as Array<{
              id: string;
              startTime: Date;
              endTime: Date;
              eventType: string;
              dj?: { stageName?: string };
              user?: { name?: string; email?: string };
            }>
          ).map((b) => ({
            id: b.id,
            startTime: b.startTime,
            endTime: b.endTime,
            eventType: b.eventType,
            djName: b.dj?.stageName,
            clientName: b.user?.name || b.user?.email,
          })),
        },
        { status: 409 }
      );
    }

    // If DJ is specified, check availability
    if (djId) {
      const { available, conflictingBookings } = await isDjAvailable(
        djId,
        startDateTime,
        endDateTime
      );

      console.log("DJ availability:", { available, conflictingBookings });

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
    }

    console.log("Creating booking with data:", {
      userId: String(session.user?.id),
      djId,
      eventType: bookingType,
      eventDate: eventDateTime,
      startTime: startDateTime,
      endTime: endDateTime,
      message,
      packageKey,
      quotedPriceCents: pkg.priceCents,
      details: extra,
    });

    const booking = await prisma.booking.create({
      data: {
        userId: String(session.user?.id),
        djId,
        eventType: bookingType,
        eventDate: eventDateTime,
        startTime: startDateTime,
        endTime: endDateTime,
        message,
        packageKey,
        quotedPriceCents: pkg.priceCents,
        details: extra,
      },
    });

    console.log("Booking created:", {
      id: booking.id,
      eventDate: booking.eventDate.toISOString(),
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
    });

    return NextResponse.json(
      { ok: true, data: booking, quotedPriceCents: pkg.priceCents },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/bookings error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
