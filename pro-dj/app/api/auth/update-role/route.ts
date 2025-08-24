import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["CLIENT", "DJ"]),
  contractorTerms: z.boolean().optional(),
  businessType: z.enum(["SOLE_PROPRIETOR", "CORPORATION"]).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = updateRoleSchema.parse(body);

    // Update user and create security clearance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          role: validatedData.role,
          agreedToTerms: true,
          agreedToPrivacy: true,
          termsAgreedAt: new Date(),
          privacyAgreedAt: new Date(),
          termsVersion: "1.0",
          privacyVersion: "1.0",
          ...(validatedData.role === "DJ"
            ? validatedData.contractorTerms && validatedData.businessType
              ? {
                  // DJ role update with contractor terms (from terms agreement flow)
                  agreedToContractorTerms: true,
                  agreedToServiceProviderTerms: true,
                  contractorTermsAgreedAt: new Date(),
                  serviceProviderTermsAgreedAt: new Date(),
                  contractorTermsVersion: "1.0",
                  serviceProviderTermsVersion: "1.0",
                }
              : {
                  // Regular DJ role update (without contractor terms yet)
                  agreedToContractorTerms: false,
                  agreedToServiceProviderTerms: false,
                }
            : {}),
        },
      });

      // Create or update SecurityClearance record for DJs with business information
      if (
        validatedData.role === "DJ" &&
        validatedData.contractorTerms &&
        validatedData.businessType
      ) {
        await tx.securityClearance.upsert({
          where: { userId: session.user.id },
          update: {
            businessType: validatedData.businessType,
            isCorporation: validatedData.businessType === "CORPORATION",
            isSoleProprietor: validatedData.businessType === "SOLE_PROPRIETOR",
          },
          create: {
            userId: session.user.id,
            businessType: validatedData.businessType,
            isCorporation: validatedData.businessType === "CORPORATION",
            isSoleProprietor: validatedData.businessType === "SOLE_PROPRIETOR",
          },
        });
      }

      return updatedUser;
    });

    const updatedUser = result;

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Update role error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
