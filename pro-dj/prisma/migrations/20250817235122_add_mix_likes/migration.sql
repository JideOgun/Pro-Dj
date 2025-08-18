-- AlterTable
ALTER TABLE "public"."DjMix" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."MixLike" (
    "id" TEXT NOT NULL,
    "mixId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MixLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MixLike_mixId_idx" ON "public"."MixLike"("mixId");

-- CreateIndex
CREATE INDEX "MixLike_userId_idx" ON "public"."MixLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MixLike_mixId_userId_key" ON "public"."MixLike"("mixId", "userId");

-- AddForeignKey
ALTER TABLE "public"."MixLike" ADD CONSTRAINT "MixLike_mixId_fkey" FOREIGN KEY ("mixId") REFERENCES "public"."DjMix"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MixLike" ADD CONSTRAINT "MixLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
