import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check for secret token to prevent unauthorized access
    const { token } = await req.json();
    const expectedToken = process.env.MIGRATION_SECRET_TOKEN;
    
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid migration token." },
        { status: 401 }
      );
    }

    console.log("Starting database migration...");
    
    // Run the specific SQL migrations that are missing
    const migrations = [
      // Update BookingStatus enum to include new values
      `DO $$ 
      BEGIN
        -- Add new enum values if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_ADMIN_REVIEW' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
          ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_ADMIN_REVIEW';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ADMIN_REVIEWING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
          ALTER TYPE "BookingStatus" ADD VALUE 'ADMIN_REVIEWING';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DJ_ASSIGNED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
          ALTER TYPE "BookingStatus" ADD VALUE 'DJ_ASSIGNED';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'COMPLETED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
          ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CANCELLED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
          ALTER TYPE "BookingStatus" ADD VALUE 'CANCELLED';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DISPUTED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
          ALTER TYPE "BookingStatus" ADD VALUE 'DISPUTED';
        END IF;
      END $$;`,
      
      // Add stripeConnectAccountId and other missing fields to DjProfile
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "stripeConnectAccountStatus" TEXT;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "stripeConnectAccountEnabled" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "stripeConnectAccountCreatedAt" TIMESTAMP(3);`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "contractorType" TEXT NOT NULL DEFAULT 'SUBCONTRACTOR';`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "contractorStatus" TEXT NOT NULL DEFAULT 'PENDING';`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "contractorAgreementSigned" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "contractorAgreementDate" TIMESTAMP(3);`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "contractorSplitPercentage" DECIMAL(65,30) NOT NULL DEFAULT 30;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "platformSplitPercentage" DECIMAL(65,30) NOT NULL DEFAULT 70;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "backgroundCheckCompleted" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "backgroundCheckDate" TIMESTAMP(3);`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "equipmentTrainingCompleted" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "equipmentTrainingDate" TIMESTAMP(3);`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "prodjBrandingTrainingCompleted" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "prodjBrandingTrainingDate" TIMESTAMP(3);`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "performanceRating" DECIMAL(65,30) NOT NULL DEFAULT 0;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "totalEventsCompleted" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "lastActiveDate" TIMESTAMP(3);`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "contractStartDate" TIMESTAMP(3);`,
      `ALTER TABLE "DjProfile" ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3);`,
      
      // Add missing fields to Booking table
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "preferredDjId" TEXT;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "adminAssignedDjId" TEXT;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "adminApprovedAt" TIMESTAMP(3);`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "adminApprovedBy" TEXT;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "proDjServicePricingId" TEXT;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "selectedAddons" TEXT[];`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "clientConfirmed" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "djConfirmed" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "eventCompletedAt" TIMESTAMP(3);`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "payoutAmountCents" INTEGER;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "payoutAt" TIMESTAMP(3);`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "payoutId" TEXT;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "platformFeeCents" INTEGER;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "disputeCreatedAt" TIMESTAMP(3);`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "disputeReason" TEXT;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "disputeResolvedAt" TIMESTAMP(3);`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "escrowStatus" TEXT NOT NULL DEFAULT 'PENDING';`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "payoutStatus" TEXT NOT NULL DEFAULT 'PENDING';`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "disputeStatus" TEXT NOT NULL DEFAULT 'NONE';`,
    ];

    const results = [];
    for (const migration of migrations) {
      try {
        await prisma.$executeRawUnsafe(migration);
        results.push(`✅ ${migration}`);
      } catch (error) {
        // Ignore errors for columns that already exist
        if (error instanceof Error && error.message.includes('already exists')) {
          results.push(`⏭️ ${migration} (already exists)`);
        } else {
          results.push(`❌ ${migration}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Update existing bookings with old status values
    const dataMigrations = [
      `UPDATE "Booking" SET status = 'CANCELLED' WHERE status = 'DECLINED';`,
      `UPDATE "Booking" SET status = 'PENDING_ADMIN_REVIEW' WHERE status = 'PENDING';`,
      `UPDATE "Booking" SET status = 'DJ_ASSIGNED' WHERE status = 'ACCEPTED';`,
    ];

    for (const migration of dataMigrations) {
      try {
        const result = await prisma.$executeRawUnsafe(migration);
        results.push(`✅ ${migration} (${result} rows updated)`);
      } catch (error) {
        results.push(`❌ ${migration}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log("Migration results:", results);

    return NextResponse.json({
      success: true,
      message: "Database migrations completed",
      results: results,
    });

  } catch (error) {
    console.error("Migration error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}