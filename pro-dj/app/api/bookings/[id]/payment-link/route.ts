import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrDj } from "@/lib/auth-guard";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireAdminOrDj();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: 400 });
  }

  // Get the booking
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      dj: { select: { stageName: true } },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { ok: false, error: "Booking not found" },
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
          error: "Forbidden - You can only access your own bookings",
        },
        { status: 403 }
      );
    }
  }

  if (!booking.checkoutSessionId) {
    return NextResponse.json(
      { ok: false, error: "No payment link available for this booking" },
      { status: 404 }
    );
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(
      booking.checkoutSessionId
    );

    if (session.url) {
      return NextResponse.json(
        { ok: true, checkoutUrl: session.url },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { ok: false, error: "Payment link not available" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error retrieving Stripe session:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve payment link" },
      { status: 500 }
    );
  }
}
