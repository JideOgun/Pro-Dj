import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch DJ pricing for a specific event type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string  } }
) {
  const { id } = params;
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    // Get the DJ profile with event pricing
    const djProfile = await prisma.djProfile.findUnique({
      where: { id },
      include: {
        djEventPricing: {
          where: { eventType },
        },
      },
    });

    if (!djProfile) {
      return NextResponse.json({ error: "DJ not found" }, { status: 404 });
    }

    // Get the event-specific pricing
    const eventPricing = djProfile.djEventPricing[0];
    const hourlyRateCents = eventPricing?.hourlyRateCents || 0;

    return NextResponse.json({
      ok: true,
      data: {
        djId: djProfile.id,
        eventType,
        hourlyRateCents,
        hasPricing: !!eventPricing,
      },
    });
  } catch (error) {
    console.error("Error fetching DJ pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}
