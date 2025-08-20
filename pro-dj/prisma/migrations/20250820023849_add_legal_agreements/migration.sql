-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "agreedToPrivacy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacyAgreedAt" TIMESTAMP(3),
ADD COLUMN     "privacyVersion" TEXT,
ADD COLUMN     "termsAgreedAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;

-- CreateTable
CREATE TABLE "public"."PaymentMetric" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "amount" INTEGER NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "PaymentAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentMetric_type_timestamp_idx" ON "public"."PaymentMetric"("type", "timestamp");

-- CreateIndex
CREATE INDEX "PaymentMetric_bookingId_idx" ON "public"."PaymentMetric"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentAlert_type_isResolved_idx" ON "public"."PaymentAlert"("type", "isResolved");

-- CreateIndex
CREATE INDEX "PaymentAlert_timestamp_idx" ON "public"."PaymentAlert"("timestamp");
