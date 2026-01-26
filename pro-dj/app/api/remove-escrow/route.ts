import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple one-time endpoint to remove escrow column
// Can be deleted after use
export async function POST(req: NextRequest) {
  try {
    console.log("Creating missing enums and removing escrow...");

    const migrations = [
      // Create PayoutStatus enum if it doesn't exist
      `DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayoutStatus') THEN
          CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
        END IF;
      END $$;`,

      // Create DisputeStatus enum if it doesn't exist
      `DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeStatus') THEN
          CREATE TYPE "public"."DisputeStatus" AS ENUM ('NONE', 'OPEN', 'RESOLVED', 'ESCALATED');
        END IF;
      END $$;`,

      // Drop the index on escrowStatus first
      `DROP INDEX IF EXISTS "public"."Booking_escrowStatus_idx";`,
      
      // Drop the escrowStatus column
      `ALTER TABLE "public"."Booking" DROP COLUMN IF EXISTS "escrowStatus";`,
      
      // Drop the EscrowStatus enum type
      `DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EscrowStatus') THEN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE udt_name = 'EscrowStatus'
          ) THEN
            DROP TYPE "public"."EscrowStatus";
          END IF;
        END IF;
      END $$;`,

      // Update payoutStatus column to use enum type if it exists as TEXT
      // First update any invalid values to valid enum values, then convert
      `DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Booking' AND column_name = 'payoutStatus' AND data_type = 'text'
        ) THEN
          -- Update any invalid values to 'PENDING' before converting
          UPDATE "Booking" SET "payoutStatus" = 'PENDING' 
          WHERE "payoutStatus" IS NOT NULL 
          AND "payoutStatus" NOT IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
          
          -- Now convert to enum
          ALTER TABLE "Booking" ALTER COLUMN "payoutStatus" TYPE "public"."PayoutStatus" 
          USING CASE 
            WHEN "payoutStatus" IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED') 
            THEN "payoutStatus"::"public"."PayoutStatus"
            ELSE 'PENDING'::"public"."PayoutStatus"
          END;
        ELSIF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Booking' AND column_name = 'payoutStatus'
        ) THEN
          ALTER TABLE "Booking" ADD COLUMN "payoutStatus" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING';
        END IF;
      END $$;`,

      // Update disputeStatus column to use enum type if it exists as TEXT
      `DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Booking' AND column_name = 'disputeStatus' AND data_type = 'text'
        ) THEN
          -- Update any invalid values to 'NONE' before converting
          UPDATE "Booking" SET "disputeStatus" = 'NONE' 
          WHERE "disputeStatus" IS NOT NULL 
          AND "disputeStatus" NOT IN ('NONE', 'OPEN', 'RESOLVED', 'ESCALATED');
          
          -- Now convert to enum
          ALTER TABLE "Booking" ALTER COLUMN "disputeStatus" TYPE "public"."DisputeStatus" 
          USING CASE 
            WHEN "disputeStatus" IN ('NONE', 'OPEN', 'RESOLVED', 'ESCALATED') 
            THEN "disputeStatus"::"public"."DisputeStatus"
            ELSE 'NONE'::"public"."DisputeStatus"
          END;
        ELSIF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Booking' AND column_name = 'disputeStatus'
        ) THEN
          ALTER TABLE "Booking" ADD COLUMN "disputeStatus" "public"."DisputeStatus" NOT NULL DEFAULT 'NONE';
        END IF;
      END $$;`,
    ];

    const results = [];
    for (const migration of migrations) {
      try {
        await prisma.$executeRawUnsafe(migration);
        results.push(`✅ Success: ${migration.substring(0, 50)}...`);
      } catch (error) {
        results.push(
          `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    console.log("Migration results:", results);

    return NextResponse.json({
      success: true,
      message: "Missing enums created and escrow column removed",
      results: results,
    });
  } catch (error) {
    console.error("Error removing escrow:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
