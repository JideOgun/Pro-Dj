/*
  Warnings:

  - You are about to drop the column `businessAddress` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `businessName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `businessPhone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isCorporation` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isSoleProprietor` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `taxId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "businessAddress",
DROP COLUMN "businessName",
DROP COLUMN "businessPhone",
DROP COLUMN "isCorporation",
DROP COLUMN "isSoleProprietor",
DROP COLUMN "taxId";

-- CreateTable
CREATE TABLE "public"."SecurityClearance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedTaxId" TEXT,
    "taxIdLastFour" TEXT,
    "taxIdType" TEXT,
    "businessName" TEXT,
    "businessAddress" TEXT,
    "businessPhone" TEXT,
    "isCorporation" BOOLEAN NOT NULL DEFAULT false,
    "isSoleProprietor" BOOLEAN NOT NULL DEFAULT true,
    "businessType" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "lastAccessedBy" TEXT,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "dataRetentionDate" TIMESTAMP(3),
    "isRetentionSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityClearance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecurityClearance_userId_key" ON "public"."SecurityClearance"("userId");

-- CreateIndex
CREATE INDEX "SecurityClearance_userId_idx" ON "public"."SecurityClearance"("userId");

-- CreateIndex
CREATE INDEX "SecurityClearance_isVerified_idx" ON "public"."SecurityClearance"("isVerified");

-- CreateIndex
CREATE INDEX "SecurityClearance_dataRetentionDate_idx" ON "public"."SecurityClearance"("dataRetentionDate");

-- AddForeignKey
ALTER TABLE "public"."SecurityClearance" ADD CONSTRAINT "SecurityClearance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
