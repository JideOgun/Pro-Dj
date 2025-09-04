import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { id } = params;
    const {
      backgroundCheckCompleted,
      equipmentTrainingCompleted,
      prodjBrandingTrainingCompleted,
      contractorAgreementSigned,
    } = await req.json();

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

    if (typeof prodjBrandingTrainingCompleted === "boolean") {
      updateData.prodjBrandingTrainingCompleted =
        prodjBrandingTrainingCompleted;
      if (prodjBrandingTrainingCompleted) {
        updateData.prodjBrandingTrainingDate = new Date();
      }
    }

    if (typeof contractorAgreementSigned === "boolean") {
      updateData.contractorAgreementSigned = contractorAgreementSigned;
      if (contractorAgreementSigned) {
        updateData.contractorAgreementDate = new Date();
      }
    }

    // Auto-activate if all training completed
    const dj = await prisma.djProfile.findUnique({
      where: { id },
      select: {
        backgroundCheckCompleted: true,
        equipmentTrainingCompleted: true,
        prodjBrandingTrainingCompleted: true,
        contractorAgreementSigned: true,
        stripeConnectAccountEnabled: true,
      },
    });

    if (dj) {
      const allTrainingComplete =
        (updateData.backgroundCheckCompleted ?? dj.backgroundCheckCompleted) &&
        (updateData.equipmentTrainingCompleted ??
          dj.equipmentTrainingCompleted) &&
        (updateData.prodjBrandingTrainingCompleted ??
          dj.prodjBrandingTrainingCompleted) &&
        (updateData.contractorAgreementSigned ??
          dj.contractorAgreementSigned) &&
        dj.stripeConnectAccountEnabled;

      if (allTrainingComplete) {
        updateData.contractorStatus = "ACTIVE";
        updateData.isAcceptingBookings = true;
      }
    }

    const updatedDj = await prisma.djProfile.update({
      where: { id },
      data: updateData,
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
      message: "Training status updated",
      subcontractor: {
        id: updatedDj.id,
        stageName: updatedDj.stageName,
        contractorStatus: updatedDj.contractorStatus,
        backgroundCheckCompleted: updatedDj.backgroundCheckCompleted,
        equipmentTrainingCompleted: updatedDj.equipmentTrainingCompleted,
        prodjBrandingTrainingCompleted:
          updatedDj.prodjBrandingTrainingCompleted,
        contractorAgreementSigned: updatedDj.contractorAgreementSigned,
        isAcceptingBookings: updatedDj.isAcceptingBookings,
        user: updatedDj.user,
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
  req: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { id } = params;

    const dj = await prisma.djProfile.findUnique({
      where: { id },
      select: {
        id: true,
        stageName: true,
        contractorStatus: true,
        backgroundCheckCompleted: true,
        backgroundCheckDate: true,
        equipmentTrainingCompleted: true,
        equipmentTrainingDate: true,
        prodjBrandingTrainingCompleted: true,
        prodjBrandingTrainingDate: true,
        contractorAgreementSigned: true,
        contractorAgreementDate: true,
        stripeConnectAccountEnabled: true,
        isAcceptingBookings: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!dj) {
      return NextResponse.json(
        { error: "Subcontractor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subcontractor: dj,
    });
  } catch (error) {
    console.error("Error fetching training status:", error);
    return NextResponse.json(
      { error: "Failed to fetch training status" },
      { status: 500 }
    );
  }
}
