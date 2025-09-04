import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch Pro-DJ packages and add-ons for booking (client-facing)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get("eventType");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    // Get all available packages for this event type
    const packages = await prisma.proDjServicePricing.findMany({
      where: { 
        eventType,
        isActive: true 
      },
      include: {
        proDjAddons: true
      },
      orderBy: [
        { packageType: "asc" },
        { durationHours: "asc" }
      ]
    });

    if (packages.length === 0) {
      return NextResponse.json(
        { error: "No packages available for this event type" },
        { status: 404 }
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
      packages: packages.map(pkg => ({
        id: pkg.id,
        packageType: pkg.packageType,
        packageName: pkg.packageName,
        basePriceCents: pkg.basePriceCents || (pkg.basePricePerHour ? pkg.basePricePerHour * (pkg.durationHours || pkg.minimumHours) : 0),
        durationHours: pkg.durationHours || pkg.minimumHours,
        description: pkg.description,
        includedAddons: pkg.proDjAddons.map(addon => addon.id),
        regionMultiplier: pkg.regionMultiplier,
      })),
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
          (addon.pricePerHour && durationHours > 0 ? addon.pricePerHour * durationHours : 0),
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

// POST - Calculate total pricing with selected package and add-ons
export async function POST(req: NextRequest) {
  try {
    const {
      eventType,
      packageId,
      startTime,
      endTime,
      selectedAddons = [],
      region,
    } = await req.json();

    if (!eventType || !packageId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Event type, package ID, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Get the selected package
    const servicePricing = await prisma.proDjServicePricing.findUnique({
      where: { id: packageId },
      include: {
        proDjAddons: true
      }
    });

    if (!servicePricing || !servicePricing.isActive) {
      return NextResponse.json(
        { error: "Package not found or not available" },
        { status: 404 }
      );
    }

    // Calculate duration
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // For package-based pricing, use the package price directly
    const basePriceCents = servicePricing.basePriceCents || 
      (servicePricing.basePricePerHour ? servicePricing.basePricePerHour * (servicePricing.durationHours || servicePricing.minimumHours) : 0);

    // Calculate additional add-on prices (beyond what's included in the package)
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
          (addon.pricePerHour ? addon.pricePerHour * durationHours : 0);
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
        billableHours: servicePricing.durationHours || servicePricing.minimumHours,
        minimumHours: servicePricing.minimumHours,
        basePricePerHour: servicePricing.basePricePerHour,
        basePriceCents,
        addonPriceCents,
        totalPriceCents,
        regionMultiplier: servicePricing.regionMultiplier,
        packageName: servicePricing.packageName,
        packageType: servicePricing.packageType,
      },
      selectedAddons: addonDetails,
      includedAddons: servicePricing.proDjAddons.map(addon => ({
        id: addon.id,
        name: addon.name,
        category: addon.category,
      })),
    });
  } catch (error) {
    console.error("Error calculating Pro-DJ pricing:", error);
    return NextResponse.json(
      { error: "Failed to calculate pricing" },
      { status: 500 }
    );
  }
}
