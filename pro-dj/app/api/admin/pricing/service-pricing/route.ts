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

    // Upsert service pricing
    const servicePricing = await prisma.proDjServicePricing.upsert({
      where: { eventType },
      update: {
        basePricePerHour,
        minimumHours: minimumHours || 4,
        description,
      },
      create: {
        eventType,
        basePricePerHour,
        minimumHours: minimumHours || 4,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      pricing: servicePricing,
    });
  } catch (error) {
    console.error("Error creating/updating service pricing:", error);
    return NextResponse.json(
      { error: "Failed to save service pricing" },
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
