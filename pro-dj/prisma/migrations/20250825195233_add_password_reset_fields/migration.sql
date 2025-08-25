-- AlterTable
ALTER TABLE "public"."DjProfile" ADD COLUMN     "stripeCustomerId" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "freeUploadsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxFreeUploads" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."PromoCodeRedemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promoCode" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT NOT NULL,

    CONSTRAINT "PromoCodeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoCodeRedemption_userId_idx" ON "public"."PromoCodeRedemption"("userId");

-- CreateIndex
CREATE INDEX "PromoCodeRedemption_promoCode_idx" ON "public"."PromoCodeRedemption"("promoCode");

-- CreateIndex
CREATE INDEX "PromoCodeRedemption_subscriptionId_idx" ON "public"."PromoCodeRedemption"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeRedemption_userId_promoCode_key" ON "public"."PromoCodeRedemption"("userId", "promoCode");

-- AddForeignKey
ALTER TABLE "public"."PromoCodeRedemption" ADD CONSTRAINT "PromoCodeRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCodeRedemption" ADD CONSTRAINT "PromoCodeRedemption_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
