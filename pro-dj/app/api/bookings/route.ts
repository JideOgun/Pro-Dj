import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { BOOKING_CONFIG } from "@/lib/booking-config";
import {
  validateBookingTime,
  isDjAvailable,
  getAvailableDjs,
} from "@/lib/booking-utils";

// GET admin only: list bookings
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status }
    );

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { email: true, name: true } } },
  });
  return NextResponse.json({ ok: true, data: bookings });
}

// Post (public - create booking request)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Restrict booking creation to CLIENT users only
    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { ok: false, error: "Only clients can create booking requests" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const bookingType = String(body?.bookingType ?? "").trim();
    const packageKey = String(body?.packageKey ?? "").trim();
    const eventDate = String(body?.eventDate ?? "").trim();
    const startTime = String(body?.startTime ?? "").trim();
    const endTime = String(body?.endTime ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const djId = body?.djId ? String(body.djId).trim() : null;
    const extra = body?.extra ?? null; // optional future use

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
    if (!pkg) {
      return NextResponse.json(
        { ok: false, error: "Invalid type or package" },
        { status: 400 }
      );
    }

    // Parse and validate times
    const eventDateTime = new Date(eventDate);
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    // Validate booking time
    const timeValidation = validateBookingTime(startDateTime, endDateTime);
    if (!timeValidation.valid) {
      return NextResponse.json(
        { ok: false, error: timeValidation.error },
        { status: 400 }
      );
    }

    // If DJ is specified, check availability
    if (djId) {
      const { available, conflictingBookings } = await isDjAvailable(
        djId,
        startDateTime,
        endDateTime
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
    }

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

    return NextResponse.json(
      { ok: true, data: booking, quotedPriceCents: pkg.priceCents },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.log("POST /api/bookings error:", error);
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
