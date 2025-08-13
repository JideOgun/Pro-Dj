import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { clientConfirmedHtml, djConfirmedHtml } from "@/lib/emails";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig)
    return NextResponse.json(
      { ok: false, error: "Missing signature" },
      { status: 400 }
    );

  const buf = await req.arrayBuffer();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-07-30.basil",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(buf),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  console.log("📨 Stripe webhook received:", event.type);

  if (event.type === "checkout.session.completed") {
    console.log("🔄 Stripe webhook: checkout.session.completed received");
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    console.log("📋 Booking ID from metadata:", bookingId);

    if (bookingId) {
      try {
        console.log("🔄 Updating booking status to CONFIRMED...");
        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED", isPaid: true, paidAt: new Date() },
          include: { user: { select: { email: true, name: true } } },
        });
        console.log(
          "✅ Booking updated successfully:",
          booking.id,
          booking.status
        );

        // emails: client + DJ
        const clientEmail =
          ((booking.details as Record<string, unknown>)
            ?.contactEmail as string) ||
          booking.user?.email ||
          "";
        if (clientEmail) {
          await sendMail(
            clientEmail,
            "Payment received — booking confirmed 🎉",
            clientConfirmedHtml({
              eventType: booking.eventType,
              eventDateISO: booking.eventDate.toISOString().slice(0, 10),
            })
          );
        }
        const djEmail = process.env.DJ_NOTIFY_EMAIL || "";
        if (djEmail) {
          await sendMail(
            djEmail,
            "New confirmed booking",
            djConfirmedHtml({
              eventType: booking.eventType,
              eventDateISO: booking.eventDate.toISOString().slice(0, 10),
              clientEmail,
            })
          );
        }
      } catch (error) {
        console.error("❌ Error updating booking:", error);
        return NextResponse.json(
          { ok: false, error: "Failed to update booking" },
          { status: 500 }
        );
      }
    } else {
      console.log("⚠️ No booking ID found in session metadata");
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
