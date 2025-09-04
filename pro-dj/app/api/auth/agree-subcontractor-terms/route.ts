import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { agreedToSubcontractorTerms, w9Submitted } = await req.json();

    // Validate that agreement is true
    if (!agreedToSubcontractorTerms) {
      return NextResponse.json(
        { error: "Subcontractor Agreement must be agreed to" },
        { status: 400 }
      );
    }

    // Get current document version
    const currentSubcontractorTermsVersion = "2.0.0"; // Updated for subcontractor model

    // Update user with subcontractor agreement information
    const updateData: any = {
      agreedToContractorTerms: true,
      contractorTermsAgreedAt: new Date(),
      contractorTermsVersion: currentSubcontractorTermsVersion,
    };

    // Update W-9 status if provided
    if (typeof w9Submitted === "boolean" && w9Submitted) {
      updateData.w9Submitted = true;
      updateData.w9SubmittedAt = new Date();
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        email: true,
        agreedToContractorTerms: true,
        contractorTermsAgreedAt: true,
        contractorTermsVersion: true,
        w9Submitted: true,
        w9SubmittedAt: true,
      },
    });

    // Update DJ profile if it exists
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: updatedUser.id },
    });

    if (djProfile) {
      await prisma.djProfile.update({
        where: { id: djProfile.id },
        data: {
          contractorAgreementSigned: true,
          contractorAgreementDate: new Date(),
          // If this is the first time signing, set them to training status
          contractorStatus:
            djProfile.contractorStatus === "PENDING"
              ? "TRAINING"
              : djProfile.contractorStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Subcontractor Agreement recorded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error recording subcontractor agreement:", error);
    return NextResponse.json(
      { error: "Failed to record agreement" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        agreedToContractorTerms: true,
        contractorTermsAgreedAt: true,
        contractorTermsVersion: true,
        w9Submitted: true,
        w9SubmittedAt: true,
        djProfile: {
          select: {
            contractorAgreementSigned: true,
            contractorAgreementDate: true,
            contractorStatus: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        needsSubcontractorAgreement: !user.agreedToContractorTerms,
        needsW9: !user.w9Submitted,
      },
    });
  } catch (error) {
    console.error("Error fetching subcontractor agreement status:", error);
    return NextResponse.json(
      { error: "Failed to fetch agreement status" },
      { status: 500 }
    );
  }
}
