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
import { requireActiveSubscription } from "@/lib/subscription-guards";

// GET admin and DJ: list bookings
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow ADMIN and DJ users to access bookings
  if (session.user.role !== "ADMIN" && session.user.role !== "DJ") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const eventType = searchParams.get("eventType");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sortBy = searchParams.get("sortBy") || "newest"; // "newest", "oldest", "date", "status"

  const skip = (page - 1) * limit;

  // Build the query based on user role
  const whereClause: Record<string, unknown> = {};

  if (session.user.role === "ADMIN") {
    // Admin sees all bookings
  } else if (session.user.role === "DJ") {
    // DJ sees only their bookings - need to get their DJ profile first
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (djProfile) {
      whereClause.djId = djProfile.id;
    } else {
      // If no DJ profile found, show no bookings
      whereClause.djId = null;
    }
  }

  // Add filters
  if (status) {
    whereClause.status = status;
  }

  if (eventType) {
    whereClause.eventType = eventType;
  }

  if (dateFrom || dateTo) {
    whereClause.eventDate = {};
    if (dateFrom) {
      (whereClause.eventDate as Record<string, unknown>).gte = new Date(
        dateFrom
      );
    }
    if (dateTo) {
      (whereClause.eventDate as Record<string, unknown>).lte = new Date(dateTo);
    }
  }

  // Build order by clause
  const orderBy: Record<string, string> = {};
  switch (sortBy) {
    case "oldest":
      orderBy.createdAt = "asc";
      break;
    case "date":
      orderBy.eventDate = "desc";
      break;
    case "status":
      orderBy.status = "asc";
      break;
    case "newest":
    default:
      orderBy.createdAt = "desc";
      break;
  }

  // Fetch bookings with pagination
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
      include: {
        user: { select: { email: true, name: true } },
        dj: { select: { stageName: true } },
      },
    }),
    prisma.booking.count({ where: whereClause }),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return NextResponse.json({
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  });
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

    // Check subscription status for DJ users
    if (session.user.role === "DJ") {
      try {
        await requireActiveSubscription();
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            error: "Active subscription required to access bookings",
          },
          { status: 403 }
        );
      }
    }

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
    const eventDate = String(body?.eventDate ?? "").trim();
    const startTime = String(body?.startTime ?? "").trim();
    const endTime = String(body?.endTime ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const djId = body?.djId ? String(body.djId).trim() : null;
    const extra = body?.extra ?? null; // contains selectedAddons and other details
    const preferredGenres = body?.preferredGenres ?? [];
    const musicStyle = String(body?.musicStyle ?? "").trim();

    console.log("Parsed values:", {
      bookingType,
      eventDate,
      startTime,
      endTime,
      message,
      djId,
    });

    if (!bookingType || !eventDate || !startTime || !endTime || !message) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "⚠️ Please fill in all required fields to complete your booking request.",
        },
        { status: 400 }
      );
    }

    // Get DJ's pricing for this event type
    let quotedPriceCents = 0;
    if (djId) {
      const djPricing = await prisma.djEventPricing.findUnique({
        where: { djId_eventType: { djId, eventType: bookingType } },
        select: { hourlyRateCents: true },
      });

      if (djPricing) {
        // Calculate duration in hours
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationHours =
          (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        // Base price = hourly rate × duration
        quotedPriceCents = Math.round(
          djPricing.hourlyRateCents * durationHours
        );

        // Add add-on prices if any
        if (extra?.selectedAddons) {
          const selectedAddons = String(extra.selectedAddons).split(",");
          const addonPrices = await prisma.djAddon.findMany({
            where: {
              djId,
              addonKey: { in: selectedAddons },
              isActive: true,
            },
            select: { priceCents: true },
          });

          const totalAddonPrice = addonPrices.reduce(
            (sum, addon) => sum + addon.priceCents,
            0
          );
          quotedPriceCents += totalAddonPrice;
        }
      }
    }

    // Validate that we have a DJ selected
    if (!djId) {
      return NextResponse.json(
        {
          ok: false,
          error: "🎵 Please select a DJ for your booking.",
        },
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
        {
          ok: false,
          error:
            "📅 Please check your event date and time format. Make sure to select a valid date and time for your event.",
        },
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
            "⏰ Time slot conflict detected! Another DJ is already booked for this event time. Please select a different time slot or contact us for assistance.",
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

    // If DJ is specified, check availability and verification
    if (djId) {
      // First check if DJ is verified
      const djProfile = await prisma.djProfile.findUnique({
        where: { id: djId },
        select: { isApprovedByAdmin: true, stageName: true },
      });

      if (!djProfile) {
        return NextResponse.json(
          {
            ok: false,
            error: "🎧 The selected DJ profile was not found.",
          },
          { status: 404 }
        );
      }

      if (!djProfile.isApprovedByAdmin) {
        return NextResponse.json(
          {
            ok: false,
            error: `🎧 ${djProfile.stageName} is not yet verified and cannot receive bookings. Please select a different DJ.`,
          },
          { status: 403 }
        );
      }

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
            error:
              "🎧 This DJ is not available for your selected time slot. Please choose a different time or select another DJ for your event.",
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

    // Combine all details including preferences
    const bookingDetails = {
      ...extra,
      preferredGenres,
      musicStyle,
    };

    console.log("Creating booking with data:", {
      userId: String(session.user?.id),
      djId,
      eventType: bookingType,
      eventDate: eventDateTime,
      startTime: startDateTime,
      endTime: endDateTime,
      message,
      quotedPriceCents,
      details: bookingDetails,
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
        quotedPriceCents,
        details: bookingDetails,
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
      { ok: true, data: booking, quotedPriceCents },
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
