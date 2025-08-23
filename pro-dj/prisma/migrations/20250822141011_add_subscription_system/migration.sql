-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'UNPAID', 'TRIAL');

-- CreateEnum
CREATE TYPE "public"."SubscriptionTier" AS ENUM ('DJ_BASIC', 'DJ_PRO', 'DJ_PREMIUM');

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "planType" "public"."SubscriptionTier" NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "isInTrial" BOOLEAN NOT NULL DEFAULT false,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "lastPaymentDate" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3),
    "paymentMethodId" TEXT,
    "platformFeePercentage" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "trialDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionUsage" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "bookingsCount" INTEGER NOT NULL DEFAULT 0,
    "revenueGenerated" INTEGER NOT NULL DEFAULT 0,
    "platformFeesCollected" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "isCurrentPeriod" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "public"."Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "public"."Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "public"."Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "public"."Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "public"."SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_name_idx" ON "public"."SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "public"."SubscriptionPlan"("isActive");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_stripePriceId_idx" ON "public"."SubscriptionPlan"("stripePriceId");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_subscriptionId_idx" ON "public"."SubscriptionUsage"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_periodStart_idx" ON "public"."SubscriptionUsage"("periodStart");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_periodEnd_idx" ON "public"."SubscriptionUsage"("periodEnd");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_isCurrentPeriod_idx" ON "public"."SubscriptionUsage"("isCurrentPeriod");

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionUsage" ADD CONSTRAINT "SubscriptionUsage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
