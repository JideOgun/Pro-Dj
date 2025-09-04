import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch Pro-DJ pricing for booking (client-facing)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get("eventType");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const region = searchParams.get("region"); // For future regional pricing

    if (!eventType || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Event type, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Get Pro-DJ standardized pricing for this event type
    const servicePricing = await prisma.proDjServicePricing.findUnique({
      where: { eventType },
    });

    if (!servicePricing || !servicePricing.isActive) {
      return NextResponse.json(
        { error: "Pricing not available for this event type" },
        { status: 404 }
      );
    }

    // Calculate duration in hours
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Ensure minimum hours requirement
    const billableHours = Math.max(durationHours, servicePricing.minimumHours);

    // Calculate base price with regional multiplier
    const regionalRate = Math.round(
      servicePricing.basePricePerHour * servicePricing.regionMultiplier
    );
    const basePriceCents = regionalRate * billableHours;

    // Get available add-ons
    const addons = await prisma.proDjAddon.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      pricing: {
        eventType,
        basePricePerHour: regionalRate,
        durationHours,
        billableHours,
        minimumHours: servicePricing.minimumHours,
        basePriceCents,
        regionMultiplier: servicePricing.regionMultiplier,
        description: servicePricing.description,
      },
      addons: addons.map((addon) => ({
        id: addon.id,
        name: addon.name,
        description: addon.description,
        category: addon.category,
        priceFixed: addon.priceFixed,
        pricePerHour: addon.pricePerHour,
        requiresSpecialEquipment: addon.requiresSpecialEquipment,
        // Calculate total price for this booking duration
        totalPrice:
          addon.priceFixed ||
          (addon.pricePerHour ? addon.pricePerHour * billableHours : 0),
      })),
    });
  } catch (error) {
    console.error("Error fetching Pro-DJ pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}

// POST - Calculate total pricing with selected add-ons
export async function POST(req: NextRequest) {
  try {
    const {
      eventType,
      startTime,
      endTime,
      selectedAddons = [],
      region,
    } = await req.json();

    if (!eventType || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Event type, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Get Pro-DJ standardized pricing
    const servicePricing = await prisma.proDjServicePricing.findUnique({
      where: { eventType },
    });

    if (!servicePricing || !servicePricing.isActive) {
      return NextResponse.json(
        { error: "Pricing not available for this event type" },
        { status: 404 }
      );
    }

    // Calculate duration
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const billableHours = Math.max(durationHours, servicePricing.minimumHours);

    // Calculate base price
    const regionalRate = Math.round(
      servicePricing.basePricePerHour * servicePricing.regionMultiplier
    );
    const basePriceCents = regionalRate * billableHours;

    // Calculate add-on prices
    let addonPriceCents = 0;
    let addonDetails = [];

    if (selectedAddons.length > 0) {
      const addons = await prisma.proDjAddon.findMany({
        where: {
          id: { in: selectedAddons },
          isActive: true,
        },
      });

      addonDetails = addons.map((addon) => {
        const totalPrice =
          addon.priceFixed ||
          (addon.pricePerHour ? addon.pricePerHour * billableHours : 0);
        addonPriceCents += totalPrice;

        return {
          id: addon.id,
          name: addon.name,
          category: addon.category,
          priceFixed: addon.priceFixed,
          pricePerHour: addon.pricePerHour,
          totalPrice,
        };
      });
    }

    const totalPriceCents = basePriceCents + addonPriceCents;

    return NextResponse.json({
      success: true,
      calculation: {
        eventType,
        durationHours,
        billableHours,
        minimumHours: servicePricing.minimumHours,
        basePricePerHour: regionalRate,
        basePriceCents,
        addonPriceCents,
        totalPriceCents,
        regionMultiplier: servicePricing.regionMultiplier,
      },
      selectedAddons: addonDetails,
    });
  } catch (error) {
    console.error("Error calculating Pro-DJ pricing:", error);
    return NextResponse.json(
      { error: "Failed to calculate pricing" },
      { status: 500 }
    );
  }
}
