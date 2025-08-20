import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch DJ's event-specific pricing
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        djEventPricing: {
          orderBy: { eventType: "asc" },
        },
      },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      pricing: djProfile.djEventPricing,
    });
  } catch (error) {
    console.error("Error fetching DJ event pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch event pricing" },
      { status: 500 }
    );
  }
}

// POST - Create or update DJ event pricing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, hourlyRateCents, description } = body;

    // Validate required fields
    if (
      !eventType ||
      typeof hourlyRateCents !== "number" ||
      hourlyRateCents <= 0
    ) {
      return NextResponse.json(
        { error: "Event type and valid hourly rate are required" },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = [
      "Wedding",
      "Club",
      "Corporate",
      "Birthday",
      "Private Party",
    ];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Upsert event pricing
    const eventPricing = await prisma.djEventPricing.upsert({
      where: {
        djId_eventType: {
          djId: djProfile.id,
          eventType,
        },
      },
      update: {
        hourlyRateCents,
        description,
      },
      create: {
        djId: djProfile.id,
        eventType,
        hourlyRateCents,
        description,
      },
    });

    return NextResponse.json({
      ok: true,
      pricing: eventPricing,
    });
  } catch (error) {
    console.error("Error creating/updating DJ event pricing:", error);
    return NextResponse.json(
      { error: "Failed to save event pricing" },
      { status: 500 }
    );
  }
}

// DELETE - Remove DJ event pricing
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Find and delete the pricing
    const pricing = await prisma.djEventPricing.findUnique({
      where: {
        djId_eventType: {
          djId: djProfile.id,
          eventType,
        },
      },
    });

    if (!pricing) {
      return NextResponse.json({ error: "Pricing not found" }, { status: 404 });
    }

    await prisma.djEventPricing.delete({
      where: { id: pricing.id },
    });

    return NextResponse.json({
      ok: true,
      message: "Event pricing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting DJ event pricing:", error);
    return NextResponse.json(
      { error: "Failed to delete event pricing" },
      { status: 500 }
    );
  }
}
