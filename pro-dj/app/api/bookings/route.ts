import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

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
  return NextResponse.json({ ok: true, data: bookings});
}

// Post (public - create booking request)
export async function POST() {
  // TODO validate body with Zod and insert record
  return NextResponse.json(
    { ok: true, note: "POST /bookings stub" },
    { status: 201 }
  );
}
