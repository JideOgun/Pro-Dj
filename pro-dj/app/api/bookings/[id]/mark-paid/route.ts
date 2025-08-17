import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { sendMail } from "@/lib/email";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status }
    );

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!booking)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 }
    );

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", isPaid: true, paidAt: new Date() },
  });

  // Optional: send confirmation emails (soft-fail)
  if (booking.user?.email) {
    await sendMail(
      booking.user.email,
      "Payment received — booking confirmed 🎉",
      `<p>Hey ${booking.user?.name ?? ""},</p>
       <p>Your ${booking.eventType} on <b>${booking.eventDate
        .toISOString()
        .slice(0, 10)}</b> is now confirmed.</p>
       <p>See you there! — Jay Baba</p>`
    );
  }

  // (Optionally email DJ address here as well if you have a notifications email)

  return NextResponse.json({ ok: true, data: updated });
}
