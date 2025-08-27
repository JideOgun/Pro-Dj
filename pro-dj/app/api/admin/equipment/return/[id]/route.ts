import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { condition, notes } = await request.json();

    if (!condition) {
      return NextResponse.json(
        { error: "Equipment condition is required" },
        { status: 400 }
      );
    }

    // Get assignment details
    const assignment = await prisma.equipmentAssignment.findUnique({
      where: { id },
      include: {
        equipment: true,
        dj: {
          select: {
            stageName: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.returnedDate) {
      return NextResponse.json(
        { error: "Equipment already returned" },
        { status: 400 }
      );
    }

    // Update assignment record
    const updatedAssignment = await prisma.equipmentAssignment.update({
      where: { id },
      data: {
        returnedDate: new Date(),
        condition,
        notes,
      },
    });

    // Update equipment condition if it changed
    if (condition !== assignment.equipment.condition) {
      await prisma.equipmentItem.update({
        where: { id: assignment.equipmentId },
        data: {
          condition,
          maintenanceNotes: notes ? `${new Date().toISOString()}: ${notes}` : assignment.equipment.maintenanceNotes,
          lastMaintenanceDate: condition === "NEEDS_REPAIR" ? new Date() : assignment.equipment.lastMaintenanceDate,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Equipment returned from ${assignment.dj.stageName}`,
      assignment: {
        id: updatedAssignment.id,
        equipmentName: assignment.equipment.name,
        djName: assignment.dj.stageName,
        assignedDate: updatedAssignment.assignedDate,
        returnedDate: updatedAssignment.returnedDate,
        condition: updatedAssignment.condition,
        notes: updatedAssignment.notes,
      },
    });
  } catch (error) {
    console.error("Error returning equipment:", error);
    return NextResponse.json(
      { error: "Failed to return equipment" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get assignment details
    const assignment = await prisma.equipmentAssignment.findUnique({
      where: { id },
      include: {
        equipment: true,
        dj: {
          select: {
            id: true,
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
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        equipment: {
          id: assignment.equipment.id,
          name: assignment.equipment.name,
          category: assignment.equipment.category,
          brand: assignment.equipment.brand,
          model: assignment.equipment.model,
          currentCondition: assignment.equipment.condition,
        },
        dj: {
          id: assignment.dj.id,
          stageName: assignment.dj.stageName,
          name: assignment.dj.user.name,
          email: assignment.dj.user.email,
        },
        booking: assignment.booking,
        assignedDate: assignment.assignedDate,
        returnedDate: assignment.returnedDate,
        returnCondition: assignment.condition,
        notes: assignment.notes,
        isReturned: !!assignment.returnedDate,
      },
    });
  } catch (error) {
    console.error("Error getting assignment details:", error);
    return NextResponse.json(
      { error: "Failed to get assignment details" },
      { status: 500 }
    );
  }
}
