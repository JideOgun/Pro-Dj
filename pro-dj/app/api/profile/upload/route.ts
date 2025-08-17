import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processAndSaveImage, UPLOAD_TYPES } from "@/lib/upload";

// POST - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process and save image
    const processedImage = await processAndSaveImage(
      {
        buffer,
        originalname: file.name,
        mimetype: file.type,
        size: file.size,
      } as any,
      UPLOAD_TYPES.PROFILE_PICTURE,
      user.id,
      {
        width: 400,
        height: 400,
        quality: 80,
        format: "jpeg",
      }
    );

    // Save to database
    const userMedia = await prisma.userMedia.create({
      data: {
        userId: user.id,
        type: "PROFILE_PICTURE",
        url: processedImage.url,
        filename: processedImage.filename,
        originalName: processedImage.originalName,
        mimeType: processedImage.mimeType,
        size: processedImage.size,
        description: "Profile picture",
      },
    });

    // Update user's profileImage field
    await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: processedImage.url },
    });

    return NextResponse.json({
      ok: true,
      data: {
        url: processedImage.url,
        filename: processedImage.filename,
        size: processedImage.size,
      },
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return NextResponse.json(
      { error: "Failed to upload profile picture" },
      { status: 500 }
    );
  }
}

// DELETE - Remove profile picture
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userMedia: {
          where: { type: "PROFILE_PICTURE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove profile image from user
    await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: null },
    });

    // Delete the media record if it exists
    if (user.userMedia.length > 0) {
      await prisma.userMedia.delete({
        where: { id: user.userMedia[0].id },
      });
    }

    return NextResponse.json({ ok: true, message: "Profile picture removed" });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    return NextResponse.json(
      { error: "Failed to remove profile picture" },
      { status: 500 }
    );
  }
}
