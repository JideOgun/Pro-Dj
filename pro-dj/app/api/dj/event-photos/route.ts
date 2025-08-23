import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processAndSaveImage, UPLOAD_TYPES } from "@/lib/upload";
import { checkSubscriptionStatus } from "@/lib/subscription-guards";

// GET - Get DJ's event photos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { djProfile: true },
    });

    if (!user || !user.djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const featured = searchParams.get("featured") === "true";
    const eventType = searchParams.get("eventType");

    const where: any = { djId: user.djProfile.id };
    if (featured) where.isFeatured = true;
    if (eventType) where.eventType = eventType;

    const photos = await prisma.eventPhoto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.eventPhoto.count({ where });

    return NextResponse.json({
      ok: true,
      data: {
        photos,
        total,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching event photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch event photos" },
      { status: 500 }
    );
  }
}

// POST - Upload event photo
export async function POST(request: NextRequest) {
  try {
    console.log("Event photo upload request received");

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { djProfile: true },
    });

    if (!user || !user.djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Check photo limit (50 photos per DJ)
    const photoLimit = 50;
    const currentPhotoCount = await prisma.eventPhoto.count({
      where: { djId: user.djProfile.id },
    });

    if (currentPhotoCount >= photoLimit) {
      return NextResponse.json(
        {
          error: `You have reached the maximum limit of ${photoLimit} photos. Please delete some photos before uploading new ones.`,
        },
        { status: 400 }
      );
    }

    // Get form data
    const formData = await request.formData();
    console.log("Form data received:", {
      hasFile: !!formData.get("file"),
      title: formData.get("title"),
      fileSize: formData.get("file")
        ? (formData.get("file") as File).size
        : "No file",
      fileType: formData.get("file")
        ? (formData.get("file") as File).type
        : "No file",
    });

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const eventName = formData.get("eventName") as string;
    const eventDate = formData.get("eventDate") as string;
    const eventType = formData.get("eventType") as string;
    const venue = formData.get("venue") as string;
    const location = formData.get("location") as string;
    const tags = formData.get("tags") as string;
    const isFeatured = formData.get("isFeatured") === "true";

    // Check if this is a new event (freemium restriction)
    if (user.role !== "ADMIN" && eventName) {
      // Check if this event already exists for this DJ
      const existingEvent = await prisma.eventPhoto.findFirst({
        where: {
          djId: user.djProfile.id,
          eventName: eventName,
        },
      });

      // If this is a new event, check freemium limits
      if (!existingEvent) {
        // Count how many unique events this DJ has
        const uniqueEvents = await prisma.eventPhoto.findMany({
          where: { djId: user.djProfile.id },
          select: { eventName: true },
          distinct: ["eventName"],
        });

        // Check if user has an active subscription
        const subscription = await prisma.subscription.findUnique({
          where: { userId: user.id },
        });

        const hasActiveSubscription =
          subscription &&
          (subscription.status === "ACTIVE" || subscription.status === "TRIAL");

        // If they have events and don't have subscription, block new event creation
        if (uniqueEvents.length > 0 && !hasActiveSubscription) {
          return NextResponse.json(
            {
              error:
                "Free tier allows only 1 event. Upgrade to create additional events with photos.",
            },
            { status: 403 }
          );
        }
      }
    }

    if (!file) {
      console.log("No file provided");
      return NextResponse.json(
        {
          error: "Please select an image file to upload",
        },
        { status: 400 }
      );
    }

    if (!title) {
      console.log("No title provided");
      return NextResponse.json(
        {
          error: "Please provide a title for your event photo",
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.log("Invalid file type:", file.type);
      return NextResponse.json(
        {
          error: `"${file.name}" is not a valid image file. Please select a JPEG, PNG, GIF, or WebP image.`,
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      console.log("File too large:", fileSizeMB, "MB");
      return NextResponse.json(
        {
          error: `File size (${fileSizeMB}MB) exceeds the 10MB limit. Please choose a smaller image or compress your photo.`,
        },
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
      UPLOAD_TYPES.EVENT_PHOTO,
      user.id,
      {
        width: 1200,
        height: 800,
        quality: 85,
        format: "jpeg",
      }
    );

    // Parse tags
    const parsedTags = tags ? tags.split(",").map((tag) => tag.trim()) : [];

    // Save to database
    const eventPhoto = await prisma.eventPhoto.create({
      data: {
        djId: user.djProfile.id,
        title,
        description: description || undefined,
        url: processedImage.url,
        filename: processedImage.filename,
        originalName: processedImage.originalName,
        mimeType: processedImage.mimeType,
        size: processedImage.size,
        eventName: eventName || undefined,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        eventType: eventType || undefined,
        venue: venue || undefined,
        location: location || undefined,
        tags: parsedTags,
        isFeatured,
      },
    });

    console.log("Event photo created successfully:", eventPhoto.id);

    return NextResponse.json({
      ok: true,
      data: eventPhoto,
    });
  } catch (error) {
    console.error("Error uploading event photo:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    // Return more specific error information
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to upload event photo: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload event photo" },
      { status: 500 }
    );
  }
}

// DELETE - Delete event photo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { djProfile: true },
    });

    if (!user || !user.djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("id");

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required" },
        { status: 400 }
      );
    }

    // Verify the photo belongs to this DJ
    const photo = await prisma.eventPhoto.findFirst({
      where: {
        id: photoId,
        djId: user.djProfile.id,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the photo
    await prisma.eventPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({
      ok: true,
      message: "Photo deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event photo:", error);
    return NextResponse.json(
      { error: "Failed to delete event photo" },
      { status: 500 }
    );
  }
}
