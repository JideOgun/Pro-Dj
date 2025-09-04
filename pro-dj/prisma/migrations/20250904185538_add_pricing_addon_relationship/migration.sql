-- CreateTable
CREATE TABLE "public"."_ProDjAddonToProDjServicePricing" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProDjAddonToProDjServicePricing_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProDjAddonToProDjServicePricing_B_index" ON "public"."_ProDjAddonToProDjServicePricing"("B");

-- AddForeignKey
ALTER TABLE "public"."_ProDjAddonToProDjServicePricing" ADD CONSTRAINT "_ProDjAddonToProDjServicePricing_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ProDjAddon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProDjAddonToProDjServicePricing" ADD CONSTRAINT "_ProDjAddonToProDjServicePricing_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ProDjServicePricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
