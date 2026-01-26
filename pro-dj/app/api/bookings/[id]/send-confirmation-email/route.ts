import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { paymentConfirmationEmailHtml } from "@/lib/email-templates";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    // Fetch booking with all necessary data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { email: true, name: true } },
        dj: { select: { stageName: true } },
        proDjServicePricing: { select: { eventType: true, minimumHours: true } },
        proDjAddons: { select: { name: true, priceFixed: true, pricePerHour: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only send email if payment is confirmed
    if (!booking.isPaid) {
      return NextResponse.json(
        { ok: false, error: "Booking is not paid yet" },
        { status: 400 }
      );
    }

    // Determine which email to use
    const bookingFormEmail = (booking.details as Record<string, unknown>)?.contactEmail as string | undefined;
    const userAccountEmail = booking.user?.email;
    const clientEmail = bookingFormEmail || userAccountEmail || "";
    const clientName = booking.user?.name || "Valued Client";

    if (!clientEmail) {
      return NextResponse.json(
        { ok: false, error: "No email address found for booking" },
        { status: 400 }
      );
    }

    // Send the confirmation email
    const emailResult = await sendMail(
      clientEmail,
      "Payment received — booking confirmed 🎉",
      paymentConfirmationEmailHtml({
        bookingId: booking.id,
        clientName,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        quotedPriceCents: booking.quotedPriceCents,
        djName: booking.dj?.stageName || null,
        minimumHours: booking.proDjServicePricing?.minimumHours || null,
        addons: booking.proDjAddons || [],
        details: (booking.details as Record<string, unknown>) || {},
        message: booking.message || null,
      }),
    );

    if (emailResult.ok) {
      return NextResponse.json({
        ok: true,
        message: "Confirmation email sent successfully",
        email: clientEmail,
      });
    } else {
      console.error("Failed to send payment confirmation email:", emailResult.error);
      return NextResponse.json(
        { ok: false, error: emailResult.error || "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
