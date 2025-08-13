import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import Stripe from "stripe";
import { sendMail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ ok: false, error: gate.error }, { status: 400 });
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!booking)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 }
    );
  if (!booking.quotedPriceCents)
    return NextResponse.json(
      { ok: false, error: "No quote on booking" },
      { status: 400 }
    );

  // Create a Checkout Session for the quoted amount
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.user?.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${booking.eventType} - ${booking.packageKey ?? "Package"}`,
            description: `Event on ${booking.eventDate
              .toISOString()
              .slice(0, 10)}`,
          },
          unit_amount: booking.quotedPriceCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: booking.id,
      userId: booking.userId,
    },
    success_url: `${process.env.APP_URL}/book/success?bid=${booking.id}`,
    cancel_url: `${process.env.APP_URL}/book/cancel?bid=${booking.id}`,
    // optional: expires_at to limit how long they can pay
  });

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "ACCEPTED", checkoutSessionId: session.id },
  });

  //send email with session.url to client (below)
  // ...after creating `session` and updating booking to ACCEPTED:
  const payLink = session.url ?? null;

  // Email the client (soft-fail if not configured)
  if (booking.user?.email && payLink) {
    await sendMail(
      booking.user.email,
      "Your booking request was accepted — complete payment",
      `<p>Hey ${booking.user?.name ?? ""},</p>
     <p>Your ${booking.eventType} on <b>${booking.eventDate
        .toISOString()
        .slice(0, 10)}</b> was accepted.</p>
     <p>Please complete payment to confirm:</p>
     <p><a href="${payLink}">Pay now</a></p>`
    );
  }

  return NextResponse.json(
    { ok: true, data: updated, checkoutUrl: session.url },
    { status: 200 }
  );
}
