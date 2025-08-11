-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "bookingType" TEXT,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "packageKey" TEXT,
ADD COLUMN     "quotedPriceCents" INTEGER;

-- CreateTable
CREATE TABLE "public"."Pricing" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pricing_type_sortOrder_idx" ON "public"."Pricing"("type", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_type_key_key" ON "public"."Pricing"("type", "key");
