import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    })
  : null;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
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

  // Check if user can access this booking
  if (session.user.role === "DJ") {
    // DJs can only access their own bookings
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
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
  } else if (session.user.role === "CLIENT") {
    // Clients can only access their own bookings
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden - You can only access your own bookings",
        },
        { status: 403 }
      );
    }
  }
  // Admins can access any booking

  if (!booking.checkoutSessionId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No payment link available for this booking. The DJ may not have accepted the booking yet.",
      },
      { status: 404 }
    );
  }

  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { ok: false, error: "Payment processing not configured" },
        { status: 500 }
      );
    }

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
