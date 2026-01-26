import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch Pro-DJ pricing and add-ons for booking (client-facing)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get("eventType");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 },
      );
    }

    // Get pricing for this event type (simplified - no packages)
    const servicePricing = await prisma.proDjServicePricing.findFirst({
      where: {
        eventType,
        isActive: true,
      },
    });

    if (!servicePricing) {
      return NextResponse.json(
        { error: "No pricing available for this event type" },
        { status: 404 },
      );
    }

    // Get all available add-ons
    const addons = await prisma.proDjAddon.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Calculate duration if provided
    let durationHours = 0;
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    return NextResponse.json({
      success: true,
      pricing: {
        eventType: servicePricing.eventType,
        basePricePerHour: servicePricing.basePricePerHour,
        minimumHours: servicePricing.minimumHours || 4,
        regionMultiplier: servicePricing.regionMultiplier || 1.0,
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
          (addon.pricePerHour && durationHours > 0
            ? addon.pricePerHour * durationHours
            : 0),
      })),
    });
  } catch (error) {
    console.error("Error fetching Pro-DJ pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 },
    );
  }
}

// POST - Calculate total pricing with event type and add-ons (no packages)
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
        {
          error: "Event type, start time, and end time are required",
        },
        { status: 400 },
      );
    }

    // Get pricing for this event type
    const servicePricing = await prisma.proDjServicePricing.findFirst({
      where: {
        eventType,
        isActive: true,
      },
    });

    if (!servicePricing) {
      return NextResponse.json(
        { error: "Pricing not found for this event type" },
        { status: 404 },
      );
    }

    // Calculate duration
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Validate minimum hours
    const minimumHours = servicePricing.minimumHours || 4;
    const billableHours = Math.max(durationHours, minimumHours);

    // Calculate base price: hourly rate × billable hours
    const basePricePerHour = servicePricing.basePricePerHour || 0;
    const basePriceCents = Math.round(basePricePerHour * billableHours);

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
          (addon.pricePerHour ? Math.round(addon.pricePerHour * durationHours) : 0);
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
        minimumHours,
        basePricePerHour,
        basePriceCents,
        addonPriceCents,
        totalPriceCents,
        regionMultiplier: servicePricing.regionMultiplier || 1.0,
      },
      selectedAddons: addonDetails,
    });
  } catch (error) {
    console.error("Error calculating Pro-DJ pricing:", error);
    return NextResponse.json(
      { error: "Failed to calculate pricing" },
      { status: 500 },
    );
  }
}
