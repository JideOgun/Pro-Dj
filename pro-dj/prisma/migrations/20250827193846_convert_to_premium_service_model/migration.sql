/*
  Warnings:

  - The values [PENDING,ACCEPTED,DECLINED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `availability` on the `DjProfile` table. All the data in the column will be lost.
  - You are about to drop the `PromoCodeRedemption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubscriptionPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubscriptionUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."EscrowStatus" AS ENUM ('PENDING', 'HELD', 'RELEASED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DisputeStatus" AS ENUM ('NONE', 'OPEN', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."DjContractorType" AS ENUM ('SUBCONTRACTOR', 'PREMIUM_SUBCONTRACTOR', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."ContractorStatus" AS ENUM ('PENDING', 'TRAINING', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."BookingStatus_new" AS ENUM ('PENDING_ADMIN_REVIEW', 'ADMIN_REVIEWING', 'DJ_ASSIGNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED');
ALTER TABLE "public"."Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Booking" ALTER COLUMN "status" TYPE "public"."BookingStatus_new" USING ("status"::text::"public"."BookingStatus_new");
ALTER TYPE "public"."BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "public"."BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "public"."Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING_ADMIN_REVIEW';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."PromoCodeRedemption" DROP CONSTRAINT "PromoCodeRedemption_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PromoCodeRedemption" DROP CONSTRAINT "PromoCodeRedemption_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubscriptionUsage" DROP CONSTRAINT "SubscriptionUsage_subscriptionId_fkey";

-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "adminApprovedAt" TIMESTAMP(3),
ADD COLUMN     "adminApprovedBy" TEXT,
ADD COLUMN     "adminAssignedDjId" TEXT,
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "clientConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "disputeCreatedAt" TIMESTAMP(3),
ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "disputeResolvedAt" TIMESTAMP(3),
ADD COLUMN     "disputeStatus" "public"."DisputeStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "djConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "escrowStatus" "public"."EscrowStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "eventCompletedAt" TIMESTAMP(3),
ADD COLUMN     "payoutAmountCents" INTEGER,
ADD COLUMN     "payoutAt" TIMESTAMP(3),
ADD COLUMN     "payoutId" TEXT,
ADD COLUMN     "payoutStatus" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "platformFeeCents" INTEGER,
ADD COLUMN     "preferredDjId" TEXT,
ADD COLUMN     "proDjServicePricingId" TEXT,
ADD COLUMN     "selectedAddons" TEXT[],
ALTER COLUMN "status" SET DEFAULT 'PENDING_ADMIN_REVIEW';

-- AlterTable
ALTER TABLE "public"."DjProfile" DROP COLUMN "availability",
ADD COLUMN     "backgroundCheckCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "backgroundCheckDate" TIMESTAMP(3),
ADD COLUMN     "contractEndDate" TIMESTAMP(3),
ADD COLUMN     "contractStartDate" TIMESTAMP(3),
ADD COLUMN     "contractorAgreementDate" TIMESTAMP(3),
ADD COLUMN     "contractorAgreementSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contractorSplitPercentage" DECIMAL(65,30) NOT NULL DEFAULT 30,
ADD COLUMN     "contractorStatus" "public"."ContractorStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "contractorType" "public"."DjContractorType" NOT NULL DEFAULT 'SUBCONTRACTOR',
ADD COLUMN     "equipmentTrainingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "equipmentTrainingDate" TIMESTAMP(3),
ADD COLUMN     "lastActiveDate" TIMESTAMP(3),
ADD COLUMN     "performanceRating" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "platformSplitPercentage" DECIMAL(65,30) NOT NULL DEFAULT 70,
ADD COLUMN     "prodjBrandingTrainingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prodjBrandingTrainingDate" TIMESTAMP(3),
ADD COLUMN     "stripeConnectAccountCreatedAt" TIMESTAMP(3),
ADD COLUMN     "stripeConnectAccountEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeConnectAccountStatus" TEXT,
ADD COLUMN     "totalEventsCompleted" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."PromoCodeRedemption";

-- DropTable
DROP TABLE "public"."Subscription";

-- DropTable
DROP TABLE "public"."SubscriptionPlan";

-- DropTable
DROP TABLE "public"."SubscriptionUsage";

-- DropEnum
DROP TYPE "public"."SubscriptionStatus";

-- DropEnum
DROP TYPE "public"."SubscriptionTier";

-- CreateTable
CREATE TABLE "public"."ProDjServicePricing" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "basePricePerHour" INTEGER NOT NULL,
    "regionMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "minimumHours" INTEGER NOT NULL DEFAULT 4,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProDjServicePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProDjAddon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceFixed" INTEGER,
    "pricePerHour" INTEGER,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresSpecialEquipment" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProDjAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DjAvailability" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DjAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EquipmentItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(65,30),
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceNotes" TEXT,
    "lastMaintenanceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EquipmentAssignment" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "bookingId" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedDate" TIMESTAMP(3),
    "condition" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DjPerformanceMetric" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "clientRating" INTEGER,
    "onTimeArrival" BOOLEAN,
    "equipmentFunctional" BOOLEAN,
    "professionalAppearance" BOOLEAN,
    "clientFeedback" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DjPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminBookingAction" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "previousDjId" TEXT,
    "newDjId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminBookingAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientDjPreference" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "preferenceType" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDjPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProDjServicePricing_eventType_isActive_idx" ON "public"."ProDjServicePricing"("eventType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProDjServicePricing_eventType_key" ON "public"."ProDjServicePricing"("eventType");

-- CreateIndex
CREATE INDEX "ProDjAddon_category_isActive_idx" ON "public"."ProDjAddon"("category", "isActive");

-- CreateIndex
CREATE INDEX "DjAvailability_djId_idx" ON "public"."DjAvailability"("djId");

-- CreateIndex
CREATE INDEX "DjAvailability_dayOfWeek_idx" ON "public"."DjAvailability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "EquipmentItem_category_idx" ON "public"."EquipmentItem"("category");

-- CreateIndex
CREATE INDEX "EquipmentItem_isActive_idx" ON "public"."EquipmentItem"("isActive");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_equipmentId_idx" ON "public"."EquipmentAssignment"("equipmentId");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_djId_idx" ON "public"."EquipmentAssignment"("djId");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_bookingId_idx" ON "public"."EquipmentAssignment"("bookingId");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_assignedDate_idx" ON "public"."EquipmentAssignment"("assignedDate");

-- CreateIndex
CREATE INDEX "DjPerformanceMetric_djId_idx" ON "public"."DjPerformanceMetric"("djId");

-- CreateIndex
CREATE INDEX "DjPerformanceMetric_clientRating_idx" ON "public"."DjPerformanceMetric"("clientRating");

-- CreateIndex
CREATE UNIQUE INDEX "DjPerformanceMetric_djId_bookingId_key" ON "public"."DjPerformanceMetric"("djId", "bookingId");

-- CreateIndex
CREATE INDEX "AdminBookingAction_bookingId_idx" ON "public"."AdminBookingAction"("bookingId");

-- CreateIndex
CREATE INDEX "AdminBookingAction_adminId_idx" ON "public"."AdminBookingAction"("adminId");

-- CreateIndex
CREATE INDEX "AdminBookingAction_action_idx" ON "public"."AdminBookingAction"("action");

-- CreateIndex
CREATE INDEX "AdminBookingAction_createdAt_idx" ON "public"."AdminBookingAction"("createdAt");

-- CreateIndex
CREATE INDEX "ClientDjPreference_clientId_idx" ON "public"."ClientDjPreference"("clientId");

-- CreateIndex
CREATE INDEX "ClientDjPreference_djId_idx" ON "public"."ClientDjPreference"("djId");

-- CreateIndex
CREATE INDEX "ClientDjPreference_preferenceType_idx" ON "public"."ClientDjPreference"("preferenceType");

-- CreateIndex
CREATE UNIQUE INDEX "ClientDjPreference_clientId_djId_key" ON "public"."ClientDjPreference"("clientId", "djId");

-- CreateIndex
CREATE INDEX "Booking_preferredDjId_idx" ON "public"."Booking"("preferredDjId");

-- CreateIndex
CREATE INDEX "Booking_adminAssignedDjId_idx" ON "public"."Booking"("adminAssignedDjId");

-- CreateIndex
CREATE INDEX "Booking_escrowStatus_idx" ON "public"."Booking"("escrowStatus");

-- CreateIndex
CREATE INDEX "Booking_payoutStatus_idx" ON "public"."Booking"("payoutStatus");

-- CreateIndex
CREATE INDEX "Booking_adminApprovedBy_idx" ON "public"."Booking"("adminApprovedBy");

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_preferredDjId_fkey" FOREIGN KEY ("preferredDjId") REFERENCES "public"."DjProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_adminAssignedDjId_fkey" FOREIGN KEY ("adminAssignedDjId") REFERENCES "public"."DjProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_adminApprovedBy_fkey" FOREIGN KEY ("adminApprovedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_proDjServicePricingId_fkey" FOREIGN KEY ("proDjServicePricingId") REFERENCES "public"."ProDjServicePricing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DjAvailability" ADD CONSTRAINT "DjAvailability_djId_fkey" FOREIGN KEY ("djId") REFERENCES "public"."DjProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."EquipmentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_djId_fkey" FOREIGN KEY ("djId") REFERENCES "public"."DjProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DjPerformanceMetric" ADD CONSTRAINT "DjPerformanceMetric_djId_fkey" FOREIGN KEY ("djId") REFERENCES "public"."DjProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DjPerformanceMetric" ADD CONSTRAINT "DjPerformanceMetric_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminBookingAction" ADD CONSTRAINT "AdminBookingAction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminBookingAction" ADD CONSTRAINT "AdminBookingAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientDjPreference" ADD CONSTRAINT "ClientDjPreference_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientDjPreference" ADD CONSTRAINT "ClientDjPreference_djId_fkey" FOREIGN KEY ("djId") REFERENCES "public"."DjProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
