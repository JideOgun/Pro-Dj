import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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
    const { eventType, eventDate, message } = body || {};
    if (!eventType || !eventDate || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }
    const booking = await prisma.booking.create({
      data: {
        userId: String(session.user?.id),
        eventType,
        eventDate: new Date(eventDate),
        message,
      },
    });

    // TODO validate body with Zod and insert record
    return NextResponse.json({ ok: true, data: booking }, { status: 201 });
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
