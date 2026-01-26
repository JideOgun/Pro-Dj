-- Remove escrowStatus column and EscrowStatus enum

-- Drop the index on escrowStatus first
DROP INDEX IF EXISTS "public"."Booking_escrowStatus_idx";

-- Drop the escrowStatus column
ALTER TABLE "public"."Booking" DROP COLUMN IF EXISTS "escrowStatus";

-- Drop the EscrowStatus enum type (only if no other tables use it)
-- Note: This will fail if the enum is used elsewhere, which is fine - we can leave it
DO $$ 
BEGIN
  -- Check if enum exists and drop it
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EscrowStatus') THEN
    -- Check if any columns still use this enum
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE udt_name = 'EscrowStatus'
    ) THEN
      DROP TYPE "public"."EscrowStatus";
    END IF;
  END IF;
END $$;
