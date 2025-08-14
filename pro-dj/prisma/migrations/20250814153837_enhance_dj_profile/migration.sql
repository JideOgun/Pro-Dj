-- AlterTable
ALTER TABLE "public"."DjProfile" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "customGenres" TEXT,
ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "specialties" TEXT;
