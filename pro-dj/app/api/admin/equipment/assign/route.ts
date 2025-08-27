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
      equipmentIds,
      djId,
      bookingId,
      notes,
    } = await request.json();

    if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0 || !djId) {
      return NextResponse.json(
        { error: "Equipment IDs and DJ ID are required" },
        { status: 400 }
      );
    }

    // Verify DJ exists and is an employee
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: djId },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ not found" },
        { status: 404 }
      );
    }

    if (!["PART_TIME_W2", "FULL_TIME_W2"].includes(djProfile.employmentType)) {
      return NextResponse.json(
        { error: "Equipment can only be assigned to Pro-DJ employees" },
        { status: 400 }
      );
    }

    // Check if equipment is available
    const equipment = await prisma.equipmentItem.findMany({
      where: {
        id: { in: equipmentIds },
        isActive: true,
      },
      include: {
        assignments: {
          where: { returnedDate: null },
        },
      },
    });

    if (equipment.length !== equipmentIds.length) {
      return NextResponse.json(
        { error: "Some equipment items not found or inactive" },
        { status: 400 }
      );
    }

    const unavailableEquipment = equipment.filter((item) => item.assignments.length > 0);
    if (unavailableEquipment.length > 0) {
      return NextResponse.json(
        { 
          error: "Some equipment is already assigned",
          unavailableItems: unavailableEquipment.map((item) => ({
            id: item.id,
            name: item.name,
            currentAssignment: item.assignments[0],
          })),
        },
        { status: 400 }
      );
    }

    // Create assignments
    const assignments = [];
    for (const equipmentId of equipmentIds) {
      const assignment = await prisma.equipmentAssignment.create({
        data: {
          equipmentId,
          djId,
          bookingId: bookingId || null,
          notes,
        },
        include: {
          equipment: true,
          dj: {
            select: {
              stageName: true,
              user: { select: { name: true } },
            },
          },
          booking: {
            select: {
              eventType: true,
              eventDate: true,
            },
          },
        },
      });

      assignments.push(assignment);
    }

    return NextResponse.json({
      success: true,
      message: `${equipment.length} equipment items assigned to ${djProfile.stageName}`,
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        equipmentId: assignment.equipmentId,
        equipmentName: assignment.equipment.name,
        djId: assignment.djId,
        djName: assignment.dj.stageName,
        bookingId: assignment.bookingId,
        assignedDate: assignment.assignedDate,
        notes: assignment.notes,
      })),
    });
  } catch (error) {
    console.error("Error assigning equipment:", error);
    return NextResponse.json(
      { error: "Failed to assign equipment" },
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
    const djId = searchParams.get("djId");
    const bookingId = searchParams.get("bookingId");
    const active = searchParams.get("active");

    // Build filter conditions
    const where: any = {};
    if (djId) where.djId = djId;
    if (bookingId) where.bookingId = bookingId;
    if (active === "true") where.returnedDate = null;
    if (active === "false") where.returnedDate = { not: null };

    const assignments = await prisma.equipmentAssignment.findMany({
      where,
      include: {
        equipment: true,
        dj: {
          select: {
            stageName: true,
            user: { select: { name: true, email: true } },
          },
        },
        booking: {
          select: {
            id: true,
            eventType: true,
            eventDate: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { assignedDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        equipment: {
          id: assignment.equipment.id,
          name: assignment.equipment.name,
          category: assignment.equipment.category,
          brand: assignment.equipment.brand,
          model: assignment.equipment.model,
          condition: assignment.equipment.condition,
        },
        dj: {
          id: assignment.djId,
          stageName: assignment.dj.stageName,
          name: assignment.dj.user.name,
          email: assignment.dj.user.email,
        },
        booking: assignment.booking,
        assignedDate: assignment.assignedDate,
        returnedDate: assignment.returnedDate,
        condition: assignment.condition,
        notes: assignment.notes,
        isActive: !assignment.returnedDate,
      })),
    });
  } catch (error) {
    console.error("Error getting equipment assignments:", error);
    return NextResponse.json(
      { error: "Failed to get equipment assignments" },
      { status: 500 }
    );
  }
}
