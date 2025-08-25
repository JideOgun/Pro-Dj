import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrDj } from "@/lib/auth-guard";
import Stripe from "stripe";
import { sendMail } from "@/lib/email";
import { acceptEmailHtml } from "@/lib/email-templates";
import { isDjAvailable } from "@/lib/booking-utils";

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    });
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
  stripe = null;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const gate = await requireAdminOrDj();
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
  if (!booking)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 }
    );

  // Check if DJ can access this booking (only if it's their booking)
  if (gate.session?.user.role === "DJ") {
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: gate.session.user.id },
    });

    if (!djProfile || booking.djId !== djProfile.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden - You can only accept your own bookings",
        },
        { status: 403 }
      );
    }
  }
  if (!booking.quotedPriceCents)
    return NextResponse.json(
      { ok: false, error: "No quote on booking" },
      { status: 400 }
    );

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
  }

  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: "Payment processing not configured" },
      { status: 500 }
    );
  }

  // Calculate platform fee (10% of quoted price)
  const platformFeeCents = Math.round(booking.quotedPriceCents * 0.1);
  const djPayoutCents = booking.quotedPriceCents - platformFeeCents;

  // Check if DJ has Connect account for payouts
  let djConnectAccountId = null;
  if (djId) {
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: djId },
      select: { stripeConnectAccountId: true, stripeConnectAccountEnabled: true },
    });
    
    if (!djProfile?.stripeConnectAccountId || !djProfile.stripeConnectAccountEnabled) {
      return NextResponse.json(
        { ok: false, error: "DJ must complete Stripe Connect onboarding to accept bookings" },
        { status: 400 }
      );
    }
    djConnectAccountId = djProfile.stripeConnectAccountId;
  }

  // Create a Checkout Session for the quoted amount with application fee
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.user?.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${booking.eventType} - Package`,
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
      djId: djId || "",
      platformFeeCents: platformFeeCents.toString(),
      djPayoutCents: djPayoutCents.toString(),
    },
    payment_intent_data: djConnectAccountId ? {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: djConnectAccountId,
      },
    } : undefined,
    success_url: `${process.env.APP_URL}/book/success?bid=${booking.id}`,
    cancel_url: `${process.env.APP_URL}/book/cancel?bid=${booking.id}`,
    // optional: expires_at to limit how long they can pay
  });

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "ACCEPTED",
      checkoutSessionId: session.id,
      platformFeeCents: platformFeeCents,
      payoutAmountCents: djPayoutCents,
      escrowStatus: "PENDING",
      ...(djId && { djId }), // Assign DJ if provided
    },
  });

  //send email with session.url to client (below)
  // ...after creating `session` and updating booking to ACCEPTED:
  const payLink = session.url ?? null;

  const clientEmail =
    ((booking.details as Record<string, unknown>)?.contactEmail as string) || // prefer typed-in email
    booking.user?.email || // fallback to account email
    "";

  // Email the client (soft-fail if not configured)
  if (clientEmail && payLink) {
    await sendMail(
      clientEmail,
      "Your booking was accepted — complete payment",
      acceptEmailHtml({
        name: booking.user?.name,
        eventType: booking.eventType,
        eventDateISO: booking.eventDate.toISOString().slice(0, 10),
        payLink,
      })
    );
  }

  return NextResponse.json(
    { ok: true, data: updated, checkoutUrl: session.url },
    { status: 200 }
  );
}
