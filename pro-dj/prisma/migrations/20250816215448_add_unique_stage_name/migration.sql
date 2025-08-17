/*
  Warnings:

  - A unique constraint covering the columns `[stageName]` on the table `DjProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DjProfile_stageName_key" ON "public"."DjProfile"("stageName");
