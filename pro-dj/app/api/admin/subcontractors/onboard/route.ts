import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { djId, contractStartDate, platformSplit, contractorSplit } =
      await req.json();

    // Validate splits add up to 100%
    const totalSplit = (platformSplit || 70) + (contractorSplit || 30);
    if (totalSplit !== 100) {
      return NextResponse.json(
        { error: "Platform and contractor splits must total 100%" },
        { status: 400 }
      );
    }

    // Update DJ to subcontractor status
    const updatedDj = await prisma.djProfile.update({
      where: { id: djId },
      data: {
        contractorType: "SUBCONTRACTOR",
        contractorStatus: "TRAINING",
        contractStartDate: contractStartDate
          ? new Date(contractStartDate)
          : new Date(),
        platformSplitPercentage: platformSplit || 70,
        contractorSplitPercentage: contractorSplit || 30,
        contractorAgreementSigned: false, // Will be signed during onboarding
        backgroundCheckCompleted: false,
        equipmentTrainingCompleted: false,
        prodjBrandingTrainingCompleted: false,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "DJ converted to subcontractor",
      subcontractor: {
        id: updatedDj.id,
        stageName: updatedDj.stageName,
        contractorStatus: updatedDj.contractorStatus,
        platformSplit: updatedDj.platformSplitPercentage,
        contractorSplit: updatedDj.contractorSplitPercentage,
        user: updatedDj.user,
      },
    });
  } catch (error) {
    console.error("Error onboarding subcontractor:", error);
    return NextResponse.json(
      { error: "Failed to onboard subcontractor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    // Get all DJs with their contractor status
    const djs = await prisma.djProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const contractors = djs.map((dj) => ({
      id: dj.id,
      stageName: dj.stageName,
      contractorType: dj.contractorType,
      contractorStatus: dj.contractorStatus,
      platformSplit: dj.platformSplitPercentage,
      contractorSplit: dj.contractorSplitPercentage,
      contractStartDate: dj.contractStartDate,
      backgroundCheckCompleted: dj.backgroundCheckCompleted,
      equipmentTrainingCompleted: dj.equipmentTrainingCompleted,
      prodjBrandingTrainingCompleted: dj.prodjBrandingTrainingCompleted,
      stripeConnectEnabled: dj.stripeConnectAccountEnabled,
      totalEventsCompleted: dj.totalEventsCompleted,
      performanceRating: dj.performanceRating,
      user: dj.user,
    }));

    return NextResponse.json({
      success: true,
      contractors,
    });
  } catch (error) {
    console.error("Error fetching contractors:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractors" },
      { status: 500 }
    );
  }
}
