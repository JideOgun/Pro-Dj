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

    const {
      backgroundCheckCompleted,
      equipmentTrainingCompleted,
      notes,
    } = await request.json();

    // Get current DJ employee
    const djProfile = await prisma.djProfile.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ not found" },
        { status: 404 }
      );
    }

    if (!["PART_TIME_W2", "FULL_TIME_W2"].includes(djProfile.employmentType)) {
      return NextResponse.json(
        { error: "DJ is not an employee" },
        { status: 400 }
      );
    }

    // Update training status
    const updateData: any = {};
    
    if (typeof backgroundCheckCompleted === "boolean") {
      updateData.backgroundCheckCompleted = backgroundCheckCompleted;
      if (backgroundCheckCompleted) {
        updateData.backgroundCheckDate = new Date();
      }
    }
    
    if (typeof equipmentTrainingCompleted === "boolean") {
      updateData.equipmentTrainingCompleted = equipmentTrainingCompleted;
      if (equipmentTrainingCompleted) {
        updateData.equipmentTrainingDate = new Date();
      }
    }

    // Enable booking acceptance if both training and background check are complete
    if (backgroundCheckCompleted && equipmentTrainingCompleted) {
      updateData.isAcceptingBookings = true;
    }

    const updatedDj = await prisma.djProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Training status updated successfully",
      employee: {
        id: updatedDj.id,
        stageName: updatedDj.stageName,
        backgroundCheckCompleted: updatedDj.backgroundCheckCompleted,
        backgroundCheckDate: updatedDj.backgroundCheckDate,
        equipmentTrainingCompleted: updatedDj.equipmentTrainingCompleted,
        equipmentTrainingDate: updatedDj.equipmentTrainingDate,
        isAcceptingBookings: updatedDj.isAcceptingBookings,
      },
    });
  } catch (error) {
    console.error("Error updating training status:", error);
    return NextResponse.json(
      { error: "Failed to update training status" },
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

    // Get DJ employee details
    const djProfile = await prisma.djProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        performanceMetrics: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        payrollRecords: {
          orderBy: { payPeriodStart: "desc" },
          take: 5,
        },
      },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: djProfile.id,
        stageName: djProfile.stageName,
        email: djProfile.user.email,
        employmentType: djProfile.employmentType,
        employmentStartDate: djProfile.employmentStartDate,
        hourlyRate: djProfile.hourlyRate,
        eventBonus: djProfile.eventBonus,
        maxWeeklyHours: djProfile.maxWeeklyHours,
        backgroundCheckCompleted: djProfile.backgroundCheckCompleted,
        backgroundCheckDate: djProfile.backgroundCheckDate,
        equipmentTrainingCompleted: djProfile.equipmentTrainingCompleted,
        equipmentTrainingDate: djProfile.equipmentTrainingDate,
        performanceRating: djProfile.performanceRating,
        totalEventsCompleted: djProfile.totalEventsCompleted,
        isAcceptingBookings: djProfile.isAcceptingBookings,
        recentPerformance: djProfile.performanceMetrics,
        recentPayroll: djProfile.payrollRecords,
      },
    });
  } catch (error) {
    console.error("Error getting employee details:", error);
    return NextResponse.json(
      { error: "Failed to get employee details" },
      { status: 500 }
    );
  }
}
