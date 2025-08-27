import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchaseCost,
      condition = "GOOD",
      location,
    } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipmentItem.create({
      data: {
        name,
        category,
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost.toString()) : null,
        condition,
        location,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Equipment added successfully",
      equipment,
    });
  } catch (error) {
    console.error("Error adding equipment:", error);
    return NextResponse.json(
      { error: "Failed to add equipment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const available = searchParams.get("available");

    // Build filter conditions
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (condition) where.condition = condition;

    let equipment = await prisma.equipmentItem.findMany({
      where,
      include: {
        assignments: {
          where: {
            returnedDate: null, // Currently assigned
          },
          include: {
            dj: {
              select: {
                stageName: true,
                user: { select: { name: true } },
              },
            },
            booking: {
              select: {
                id: true,
                eventType: true,
                eventDate: true,
              },
            },
          },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Filter by availability if requested
    if (available === "true") {
      equipment = equipment.filter((item) => item.assignments.length === 0);
    } else if (available === "false") {
      equipment = equipment.filter((item) => item.assignments.length > 0);
    }

    // Get summary statistics
    const totalEquipment = await prisma.equipmentItem.count({
      where: { isActive: true },
    });

    const assignedEquipment = await prisma.equipmentAssignment.count({
      where: { returnedDate: null },
    });

    const categories = await prisma.equipmentItem.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      equipment: equipment.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        brand: item.brand,
        model: item.model,
        serialNumber: item.serialNumber,
        condition: item.condition,
        location: item.location,
        purchaseDate: item.purchaseDate,
        purchaseCost: item.purchaseCost,
        isActive: item.isActive,
        isAssigned: item.assignments.length > 0,
        currentAssignment: item.assignments[0] || null,
        lastMaintenanceDate: item.lastMaintenanceDate,
        maintenanceNotes: item.maintenanceNotes,
      })),
      summary: {
        total: totalEquipment,
        available: totalEquipment - assignedEquipment,
        assigned: assignedEquipment,
        categories: categories.map((cat) => ({
          category: cat.category,
          count: cat._count.id,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting equipment inventory:", error);
    return NextResponse.json(
      { error: "Failed to get equipment inventory" },
      { status: 500 }
    );
  }
}
