/*
  Warnings:

  - You are about to drop the `Mix` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `commentType` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_mixId_fkey";

-- AlterTable
ALTER TABLE "public"."Comment" ADD COLUMN     "commentType" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "dislikeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "flaggedReason" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "photoId" TEXT,
ADD COLUMN     "threadDepth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "videoId" TEXT;

-- DropTable
DROP TABLE "public"."Mix";

-- CreateTable
CREATE TABLE "public"."CommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommentDislike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentDislike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DjYouTubeVideo" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubeUrl" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" TEXT,
    "eventType" TEXT,
    "eventDate" TIMESTAMP(3),
    "venue" TEXT,
    "location" TEXT,
    "tags" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DjYouTubeVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommentLike_commentId_idx" ON "public"."CommentLike"("commentId");

-- CreateIndex
CREATE INDEX "CommentLike_userId_idx" ON "public"."CommentLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "public"."CommentLike"("commentId", "userId");

-- CreateIndex
CREATE INDEX "CommentDislike_commentId_idx" ON "public"."CommentDislike"("commentId");

-- CreateIndex
CREATE INDEX "CommentDislike_userId_idx" ON "public"."CommentDislike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentDislike_commentId_userId_key" ON "public"."CommentDislike"("commentId", "userId");

-- CreateIndex
CREATE INDEX "DjYouTubeVideo_djId_isPublic_idx" ON "public"."DjYouTubeVideo"("djId", "isPublic");

-- CreateIndex
CREATE INDEX "DjYouTubeVideo_eventType_idx" ON "public"."DjYouTubeVideo"("eventType");

-- CreateIndex
CREATE INDEX "DjYouTubeVideo_isFeatured_idx" ON "public"."DjYouTubeVideo"("isFeatured");

-- CreateIndex
CREATE INDEX "DjYouTubeVideo_sortOrder_idx" ON "public"."DjYouTubeVideo"("sortOrder");

-- CreateIndex
CREATE INDEX "Comment_commentType_mixId_idx" ON "public"."Comment"("commentType", "mixId");

-- CreateIndex
CREATE INDEX "Comment_commentType_videoId_idx" ON "public"."Comment"("commentType", "videoId");

-- CreateIndex
CREATE INDEX "Comment_commentType_postId_idx" ON "public"."Comment"("commentType", "postId");

-- CreateIndex
CREATE INDEX "Comment_commentType_photoId_idx" ON "public"."Comment"("commentType", "photoId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "public"."Comment"("parentId");

-- CreateIndex
CREATE INDEX "Comment_threadDepth_idx" ON "public"."Comment"("threadDepth");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "public"."Comment"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_mixId_fkey" FOREIGN KEY ("mixId") REFERENCES "public"."DjMix"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."DjYouTubeVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "public"."EventPhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommentDislike" ADD CONSTRAINT "CommentDislike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommentDislike" ADD CONSTRAINT "CommentDislike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DjYouTubeVideo" ADD CONSTRAINT "DjYouTubeVideo_djId_fkey" FOREIGN KEY ("djId") REFERENCES "public"."DjProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
