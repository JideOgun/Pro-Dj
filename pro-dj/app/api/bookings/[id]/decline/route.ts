import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrDj } from "@/lib/auth-guard";
import { handleBookingRejection } from "@/lib/booking-recovery";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string  } }
) {
  const { id } = params;
  const gate = await requireAdminOrDj();
  if (!gate.ok)
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status }
    );

  const body = await req.json().catch(() => ({}));
  const reason = body.reason || "No reason provided";

  // Get the booking to check access
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      dj: { select: { stageName: true } },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 }
    );
  }

  // Check if DJ can access this booking (only if it's their booking)
  if (gate.session?.user.role === "DJ") {
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: gate.session.user.id },
    });

    if (!djProfile || booking.djId !== djProfile.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden - You can only decline your own bookings",
        },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  // Trigger recovery system
  await handleBookingRejection(id, reason);

  return NextResponse.json({ ok: true, data: updated }, { status: 200 });
}
