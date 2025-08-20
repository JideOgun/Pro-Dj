-- CreateTable
CREATE TABLE "public"."DjEventPricing" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "hourlyRateCents" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DjEventPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DjEventPricing_djId_idx" ON "public"."DjEventPricing"("djId");

-- CreateIndex
CREATE UNIQUE INDEX "DjEventPricing_djId_eventType_key" ON "public"."DjEventPricing"("djId", "eventType");

-- AddForeignKey
ALTER TABLE "public"."DjEventPricing" ADD CONSTRAINT "DjEventPricing_djId_fkey" FOREIGN KEY ("djId") REFERENCES "public"."DjProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
