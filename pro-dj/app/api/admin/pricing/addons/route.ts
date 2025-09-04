import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET - Fetch all Pro-DJ standardized add-ons
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const addons = await prisma.proDjAddon.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      addons,
    });
  } catch (error) {
    console.error("Error fetching Pro-DJ add-ons:", error);
    return NextResponse.json(
      { error: "Failed to fetch add-ons" },
      { status: 500 }
    );
  }
}

// POST - Create Pro-DJ add-on
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const {
      name,
      description,
      priceFixed,
      pricePerHour,
      category,
      requiresSpecialEquipment,
    } = await req.json();

    // Validate required fields
    if (!name || !description || !category) {
      return NextResponse.json(
        { error: "Name, description, and category are required" },
        { status: 400 }
      );
    }

    // Validate that either priceFixed or pricePerHour is provided
    if (!priceFixed && !pricePerHour) {
      return NextResponse.json(
        { error: "Either fixed price or hourly price must be provided" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      "Lighting",
      "Sound",
      "MC Services",
      "Equipment",
      "Entertainment",
      "Special Effects",
      "Photography",
      "Videography",
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const addon = await prisma.proDjAddon.create({
      data: {
        name,
        description,
        priceFixed: priceFixed || null,
        pricePerHour: pricePerHour || null,
        category,
        requiresSpecialEquipment: requiresSpecialEquipment || false,
      },
    });

    return NextResponse.json({
      success: true,
      addon,
    });
  } catch (error) {
    console.error("Error creating Pro-DJ add-on:", error);
    return NextResponse.json(
      { error: "Failed to create add-on" },
      { status: 500 }
    );
  }
}
