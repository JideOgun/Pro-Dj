-- CreateEnum
CREATE TYPE "public"."UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."DjMix" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "duration" INTEGER,
    "bitrate" INTEGER,
    "sampleRate" INTEGER,
    "s3Key" TEXT NOT NULL,
    "cloudFrontUrl" TEXT,
    "localUrl" TEXT,
    "uploadStatus" "public"."UploadStatus" NOT NULL DEFAULT 'PENDING',
    "uploadProgress" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3),
    "uploadError" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "mimeType" TEXT NOT NULL,
    "format" TEXT,
    "quality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DjMix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DjMix_djId_isPublic_idx" ON "public"."DjMix"("djId", "isPublic");

-- CreateIndex
CREATE INDEX "DjMix_genre_idx" ON "public"."DjMix"("genre");

-- CreateIndex
CREATE INDEX "DjMix_uploadStatus_idx" ON "public"."DjMix"("uploadStatus");

-- CreateIndex
CREATE INDEX "DjMix_isFeatured_idx" ON "public"."DjMix"("isFeatured");

-- AddForeignKey
ALTER TABLE "public"."DjMix" ADD CONSTRAINT "DjMix_djId_fkey" FOREIGN KEY ("djId") REFERENCES "public"."DjProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
