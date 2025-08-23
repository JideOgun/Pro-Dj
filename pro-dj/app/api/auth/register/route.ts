import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { EmailService } from "@/lib/email";
import {
  encryptTaxId,
  getTaxIdLastFour,
  determineTaxIdType,
  validateTaxId,
  calculateDataRetentionDate,
} from "@/lib/security-utils";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CLIENT", "DJ"]).default("CLIENT"),
  agreedToTerms: z.boolean().optional(),
  agreedToPrivacy: z.boolean().optional(),
  contractorTerms: z.boolean().optional(),
  businessType: z.enum(["SOLE_PROPRIETOR", "CORPORATION"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: validatedData.email,
          mode: "insensitive",
        },
      },
    });

    if (existingUser) {
      let errorMessage = "An account with this email already exists.";

      if (existingUser.googleId) {
        errorMessage +=
          " This email is associated with a Google account. Please sign in with Google instead.";
      } else if (existingUser.password) {
        errorMessage +=
          " Please sign in with your password or use the 'Forgot Password' option.";
      }

      return NextResponse.json(
        { ok: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user data
    const userData = {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
      agreedToTerms: validatedData.agreedToTerms || false,
      agreedToPrivacy: validatedData.agreedToPrivacy || false,
      termsAgreedAt: validatedData.agreedToTerms ? new Date() : null,
      privacyAgreedAt: validatedData.agreedToPrivacy ? new Date() : null,
      termsVersion: validatedData.agreedToTerms ? "1.0" : null,
      privacyVersion: validatedData.agreedToPrivacy ? "1.0" : null,
    };

    // Add DJ-specific fields if applicable
    if (validatedData.role === "DJ") {
      if (validatedData.contractorTerms && validatedData.businessType) {
        // DJ registration with contractor terms (from terms agreement flow)
        Object.assign(userData, {
          agreedToContractorTerms: true,
          agreedToServiceProviderTerms: true,
          contractorTermsAgreedAt: new Date(),
          serviceProviderTermsAgreedAt: new Date(),
          contractorTermsVersion: "1.0",
          serviceProviderTermsVersion: "1.0",
          businessType: validatedData.businessType,
          isCorporation: validatedData.businessType === "CORPORATION",
          isSoleProprietor: validatedData.businessType === "SOLE_PROPRIETOR",
        });
      } else {
        // Regular DJ registration (without contractor terms yet)
        // They will need to complete contractor terms later
        Object.assign(userData, {
          agreedToContractorTerms: false,
          agreedToServiceProviderTerms: false,
        });
      }
    }

    const user = await prisma.user.create({
      data: userData as Parameters<typeof prisma.user.create>[0]["data"],
    });

    // Send welcome email
    try {
      if (user.email && user.name) {
        if (validatedData.role === "DJ") {
          await EmailService.sendDjWelcomeEmail(user.email, user.name);
        } else {
          await EmailService.sendWelcomeEmail(user.email, user.name);
        }
      }
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration due to email issues
    }

    return NextResponse.json(
      { ok: true, user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }

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
