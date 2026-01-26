import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET - Fetch all Pro-DJ standardized pricing
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const servicePricing = await prisma.proDjServicePricing.findMany({
      orderBy: { eventType: "asc" },
    });

    return NextResponse.json({
      success: true,
      pricing: servicePricing,
    });
  } catch (error) {
    console.error("Error fetching service pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch service pricing" },
      { status: 500 },
    );
  }
}

// POST - Create or update Pro-DJ service pricing
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const {
      id,
      eventType,
      basePricePerHour,
      minimumHours,
      description,
    } = await req.json();

    // Validate required fields
    if (
      !eventType ||
      typeof basePricePerHour !== "number" ||
      basePricePerHour <= 0
    ) {
      return NextResponse.json(
        { error: "Event type and valid hourly rate are required" },
        { status: 400 },
      );
    }

    // Validate event type
    const validEventTypes = [
      "Wedding",
      "Club",
      "Corporate",
      "Birthday",
      "Private Party",
      "Graduation",
      "Anniversary",
      "Holiday Party",
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 },
      );
    }

    let servicePricing;
    
    // If id is provided, update that specific record (for editing)
    if (id) {
      const existingPricing = await prisma.proDjServicePricing.findUnique({
        where: { id },
      });

      if (!existingPricing) {
        return NextResponse.json(
          { error: "Pricing not found" },
          { status: 404 },
        );
      }

      servicePricing = await prisma.proDjServicePricing.update({
        where: { id },
        data: {
          basePricePerHour,
          minimumHours: minimumHours || 4,
          description,
        },
      });
    } else {
      // Check if pricing exists for this eventType (for creating)
      // Since unique constraint is on [eventType, packageType], we find first match
      const existingPricing = await prisma.proDjServicePricing.findFirst({
        where: { 
          eventType,
          packageType: "BASIC", // Check for BASIC package type specifically
        },
      });

      if (existingPricing) {
        // Update existing pricing
        servicePricing = await prisma.proDjServicePricing.update({
          where: { id: existingPricing.id },
          data: {
            basePricePerHour,
            minimumHours: minimumHours || 4,
            description,
          },
        });
      } else {
        // Create new pricing with default packageType
        // Check if any pricing exists for this eventType to avoid conflicts
        const anyExisting = await prisma.proDjServicePricing.findFirst({
          where: { eventType },
        });

        if (anyExisting) {
          // If one exists with different packageType, update it instead
          servicePricing = await prisma.proDjServicePricing.update({
            where: { id: anyExisting.id },
            data: {
              basePricePerHour,
              minimumHours: minimumHours || 4,
              description,
            },
          });
        } else {
          // Create new pricing with default packageType
          servicePricing = await prisma.proDjServicePricing.create({
            data: {
              eventType,
              packageType: "BASIC", // Default required for unique constraint
              packageName: `${eventType} - Basic Package`, // Required field
              basePricePerHour,
              minimumHours: minimumHours || 4,
              description,
              includes: [], // Required array field
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      pricing: servicePricing,
    });
  } catch (error: any) {
    console.error("Error creating/updating service pricing:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Provide more specific error messages
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A pricing entry with this event type and package type already exists" },
        { status: 400 },
      );
    }
    
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid reference in pricing data" },
        { status: 400 },
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to save service pricing",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 },
    );
  }
}

// DELETE - Remove service pricing
export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const eventType = searchParams.get("eventType");

    // Prefer id if provided, otherwise use eventType (for backward compatibility)
    if (id) {
      const servicePricing = await prisma.proDjServicePricing.findUnique({
        where: { id },
      });

      if (!servicePricing) {
        return NextResponse.json(
          { error: "Service pricing not found" },
          { status: 404 },
        );
      }

      await prisma.proDjServicePricing.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Service pricing deleted successfully",
      });
    }

    if (!eventType) {
      return NextResponse.json(
        { error: "ID or event type is required" },
        { status: 400 },
      );
    }

    // For eventType, find the first matching record (since unique constraint includes packageType)
    // In practice, with the new hourly model, there should only be one per eventType
    const servicePricing = await prisma.proDjServicePricing.findFirst({
      where: { eventType },
    });

    if (!servicePricing) {
      return NextResponse.json(
        { error: "Service pricing not found" },
        { status: 404 },
      );
    }

    // Delete by id to avoid unique constraint issues
    await prisma.proDjServicePricing.delete({
      where: { id: servicePricing.id },
    });

    return NextResponse.json({
      success: true,
      message: "Service pricing deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting service pricing:", error);
    
    // Provide more specific error messages
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete pricing that is associated with existing bookings" },
        { status: 400 },
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to delete service pricing" },
      { status: 500 },
    );
  }
}
