import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all pricing packages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const whereClause: { isActive: boolean; type?: string } = {
      isActive: true,
    };
    if (type) {
      whereClause.type = type;
    }

    const packages = await prisma.pricing.findMany({
      where: whereClause,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching pricing packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing packages" },
      { status: 500 }
    );
  }
}

// POST - Create a new pricing package
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admins can create packages
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type, label, priceCents, isActive, sortOrder } = body;

    // Validate required fields
    if (!type || !label || typeof priceCents !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a unique key based on the label
    const generateKey = (label: string, type: string) => {
      const baseKey = label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .trim();

      return `${type.toLowerCase()}_${baseKey}`;
    };

    const key = generateKey(label, type);

    // Check if key already exists
    const existingPackage = await prisma.pricing.findFirst({
      where: { key, type },
    });

    if (existingPackage) {
      return NextResponse.json(
        {
          error: "A package with this name already exists for this event type",
        },
        { status: 409 }
      );
    }

    // Create the new package
    const newPackage = await prisma.pricing.create({
      data: {
        type,
        key,
        label,
        priceCents,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error("Error creating pricing package:", error);
    return NextResponse.json(
      { error: "Failed to create pricing package" },
      { status: 500 }
    );
  }
}
