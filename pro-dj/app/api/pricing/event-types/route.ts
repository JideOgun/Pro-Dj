import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Create a new event type
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admins can create event types
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type } = body;

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { error: "Event type name is required" },
        { status: 400 }
      );
    }

    const trimmedType = type.trim();
    if (!trimmedType) {
      return NextResponse.json(
        { error: "Event type name cannot be empty" },
        { status: 400 }
      );
    }

    // Check if event type already exists
    const existingType = await prisma.pricing.findFirst({
      where: { type: trimmedType },
    });

    if (existingType) {
      return NextResponse.json(
        { error: "Event type already exists" },
        { status: 409 }
      );
    }

    // Create a default package for the new event type
    const defaultPackage = await prisma.pricing.create({
      data: {
        type: trimmedType,
        key: `${trimmedType.toLowerCase()}_basic`,
        label: "Basic Package",
        priceCents: 25000, // $250 default
        isActive: true,
        sortOrder: 1,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event type created with default package",
        eventType: trimmedType,
        defaultPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event type:", error);
    return NextResponse.json(
      { error: "Failed to create event type" },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing event type
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admins can update event types
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { oldType, newType } = body;

    if (
      !oldType ||
      !newType ||
      typeof oldType !== "string" ||
      typeof newType !== "string"
    ) {
      return NextResponse.json(
        { error: "Both old and new event type names are required" },
        { status: 400 }
      );
    }

    const trimmedOldType = oldType.trim();
    const trimmedNewType = newType.trim();

    if (!trimmedOldType || !trimmedNewType) {
      return NextResponse.json(
        { error: "Event type names cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedOldType === trimmedNewType) {
      return NextResponse.json(
        { error: "New event type name must be different from the old one" },
        { status: 400 }
      );
    }

    // Check if new event type already exists
    const existingType = await prisma.pricing.findFirst({
      where: { type: trimmedNewType },
    });

    if (existingType) {
      return NextResponse.json(
        { error: "Event type already exists" },
        { status: 409 }
      );
    }

    // Update all packages with the old type to the new type
    const updatedPackages = await prisma.pricing.updateMany({
      where: { type: trimmedOldType },
      data: { type: trimmedNewType },
    });

    return NextResponse.json({
      success: true,
      message: "Event type updated successfully",
      updatedPackages: updatedPackages.count,
    });
  } catch (error) {
    console.error("Error updating event type:", error);
    return NextResponse.json(
      { error: "Failed to update event type" },
      { status: 500 }
    );
  }
}
