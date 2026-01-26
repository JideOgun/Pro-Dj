-- Remove regionMultiplier column from ProDjServicePricing table
-- This migration is idempotent and safe to run multiple times
DO $$ 
BEGIN
  -- Only drop the column if the table exists and the column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ProDjServicePricing'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ProDjServicePricing' 
      AND column_name = 'regionMultiplier'
    ) THEN
      ALTER TABLE "public"."ProDjServicePricing" DROP COLUMN "regionMultiplier";
    END IF;
  END IF;
END $$;
