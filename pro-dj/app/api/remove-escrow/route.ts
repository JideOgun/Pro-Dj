import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple one-time endpoint to remove escrow column
// Can be deleted after use
export async function POST(req: NextRequest) {
  try {
    console.log("Removing escrow column and enum...");

    const migrations = [
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
      message: "Escrow column and enum removed",
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
