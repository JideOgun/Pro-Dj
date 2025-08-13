import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { BOOKING_CONFIG } from "@/lib/booking-config";

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
        { ok: false, error: "Unathourized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const bookingType = String(body?.bookingType ?? "").trim();
    const packageKey = String(body?.packageKey ?? "").trim();
    const eventDate = String(body?.eventDate ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const extra = body?.extra ?? null; // optional future use

    if (!bookingType || !packageKey || !eventDate || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
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

    const booking = await prisma.booking.create({
      data: {
        userId: String(session.user?.id),
        eventType: bookingType,
        eventDate: new Date(eventDate),
        message,
        packageKey,
        quotedPriceCents: pkg.priceCents,
        details: extra,
      },
    });

    return NextResponse.json({ ok: true, data: booking, quotedPriceCents: pkg.priceCents }, { status: 201 });
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
