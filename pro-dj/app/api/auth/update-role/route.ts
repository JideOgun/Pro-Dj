import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["CLIENT", "DJ"]),
  contractorTerms: z.boolean().optional(),
  taxInfo: z
    .object({
      taxId: z.string(),
      businessName: z.string().optional(),
      businessAddress: z.string().optional(),
      businessPhone: z.string().optional(),
      isCorporation: z.boolean(),
      isSoleProprietor: z.boolean(),
    })
    .optional(),
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

    const updatedUser = await prisma.user.update({
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
          ? validatedData.contractorTerms && validatedData.taxInfo
            ? {
                // DJ role update with contractor terms (from terms agreement flow)
                agreedToContractorTerms: true,
                agreedToServiceProviderTerms: true,
                contractorTermsAgreedAt: new Date(),
                serviceProviderTermsAgreedAt: new Date(),
                contractorTermsVersion: "1.0",
                serviceProviderTermsVersion: "1.0",
                taxId: validatedData.taxInfo.taxId,
                isCorporation: validatedData.taxInfo.isCorporation,
                isSoleProprietor: validatedData.taxInfo.isSoleProprietor,
                ...(validatedData.taxInfo.isSoleProprietor
                  ? {}
                  : {
                      businessName: validatedData.taxInfo.businessName,
                      businessAddress: validatedData.taxInfo.businessAddress,
                      businessPhone: validatedData.taxInfo.businessPhone,
                    }),
                w9Submitted: true,
                w9SubmittedAt: new Date(),
              }
            : {
                // Regular DJ role update (without contractor terms yet)
                agreedToContractorTerms: false,
                agreedToServiceProviderTerms: false,
              }
          : {}),
      },
    });

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
