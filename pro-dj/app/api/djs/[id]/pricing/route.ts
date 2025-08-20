import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch DJ's pricing for a specific event type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    // Get DJ profile with event-specific pricing
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: params.id },
      include: {
        djEventPricing: {
          where: { eventType },
        },
      },
    });

    if (!djProfile) {
      return NextResponse.json({ error: "DJ not found" }, { status: 404 });
    }

    // Get the event-specific pricing, fallback to base price if not set
    const eventPricing = djProfile.djEventPricing[0];
    const hourlyRateCents =
      eventPricing?.hourlyRateCents || djProfile.basePriceCents || 0;

    return NextResponse.json({
      ok: true,
      pricing: {
        hourlyRateCents,
        eventType,
        isEventSpecific: !!eventPricing,
        description: eventPricing?.description,
      },
    });
  } catch (error) {
    console.error("Error fetching DJ pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch DJ pricing" },
      { status: 500 }
    );
  }
}
