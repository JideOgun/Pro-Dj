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
      djId,
      hourlyRate,
      eventBonus,
      maxWeeklyHours = 25,
      startDate,
    } = await request.json();

    if (!djId || !hourlyRate || !eventBonus) {
      return NextResponse.json(
        { error: "DJ ID, hourly rate, and event bonus are required" },
        { status: 400 }
      );
    }

    // Verify DJ exists and is currently a contractor
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: djId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ not found" },
        { status: 404 }
      );
    }

    if (djProfile.employmentType !== "CONTRACTOR") {
      return NextResponse.json(
        { error: "DJ is already an employee or terminated" },
        { status: 400 }
      );
    }

    // Update DJ profile to part-time employee
    const updatedDj = await prisma.djProfile.update({
      where: { id: djId },
      data: {
        employmentType: "PART_TIME_W2",
        employmentStartDate: startDate ? new Date(startDate) : new Date(),
        hourlyRate: parseFloat(hourlyRate.toString()),
        eventBonus: parseFloat(eventBonus.toString()),
        maxWeeklyHours: parseInt(maxWeeklyHours.toString()),
        backgroundCheckCompleted: false,
        equipmentTrainingCompleted: false,
        isAcceptingBookings: false, // Disabled until training complete
      },
    });

    return NextResponse.json({
      success: true,
      message: `${djProfile.stageName} converted to part-time employee`,
      employee: {
        id: updatedDj.id,
        stageName: updatedDj.stageName,
        employmentType: updatedDj.employmentType,
        hourlyRate: updatedDj.hourlyRate,
        eventBonus: updatedDj.eventBonus,
        maxWeeklyHours: updatedDj.maxWeeklyHours,
        employmentStartDate: updatedDj.employmentStartDate,
      },
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
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

    // Get all employees
    const employees = await prisma.djProfile.findMany({
      where: {
        employmentType: {
          in: ["PART_TIME_W2", "FULL_TIME_W2"],
        },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { employmentStartDate: "desc" },
    });

    // Get all contractors available for conversion
    const contractors = await prisma.djProfile.findMany({
      where: {
        employmentType: "CONTRACTOR",
        isApprovedByAdmin: true,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { totalBookings: "desc" },
    });

    return NextResponse.json({
      success: true,
      employees: employees.map((emp) => ({
        id: emp.id,
        stageName: emp.stageName,
        email: emp.user.email,
        employmentType: emp.employmentType,
        hourlyRate: emp.hourlyRate,
        eventBonus: emp.eventBonus,
        maxWeeklyHours: emp.maxWeeklyHours,
        employmentStartDate: emp.employmentStartDate,
        backgroundCheckCompleted: emp.backgroundCheckCompleted,
        equipmentTrainingCompleted: emp.equipmentTrainingCompleted,
        performanceRating: emp.performanceRating,
        totalEventsCompleted: emp.totalEventsCompleted,
        isAcceptingBookings: emp.isAcceptingBookings,
      })),
      contractors: contractors.map((contractor) => ({
        id: contractor.id,
        stageName: contractor.stageName,
        email: contractor.user.email,
        totalBookings: contractor.totalBookings,
        rating: contractor.rating,
        experience: contractor.experience,
        location: contractor.location,
      })),
    });
  } catch (error) {
    console.error("Error getting employees:", error);
    return NextResponse.json(
      { error: "Failed to get employees" },
      { status: 500 }
    );
  }
}
