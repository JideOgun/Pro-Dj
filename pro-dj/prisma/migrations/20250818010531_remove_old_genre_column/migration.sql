/*
  Warnings:

  - You are about to drop the column `genre` on the `DjMix` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."DjMix_genre_idx";

-- AlterTable
ALTER TABLE "public"."DjMix" DROP COLUMN "genre";
