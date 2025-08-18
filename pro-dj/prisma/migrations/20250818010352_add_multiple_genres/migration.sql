-- AlterTable
ALTER TABLE "public"."DjMix" ADD COLUMN     "genres" TEXT[];

-- Migrate existing genre data to genres array
UPDATE "public"."DjMix" 
SET "genres" = ARRAY["genre"] 
WHERE "genre" IS NOT NULL AND "genre" != '';

-- CreateIndex
CREATE INDEX "DjMix_genres_idx" ON "public"."DjMix"("genres");
