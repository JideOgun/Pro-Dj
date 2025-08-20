-- CreateTable
CREATE TABLE "public"."DjAddon" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "addonKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DjAddon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DjAddon_djId_isActive_idx" ON "public"."DjAddon"("djId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DjAddon_djId_addonKey_key" ON "public"."DjAddon"("djId", "addonKey");

-- AddForeignKey
ALTER TABLE "public"."DjAddon" ADD CONSTRAINT "DjAddon_djId_fkey" FOREIGN KEY ("djId") REFERENCES "public"."DjProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
