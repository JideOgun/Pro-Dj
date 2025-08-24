import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string  } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { role, adminId } = await req.json();

    if (!role || !adminId) {
      return NextResponse.json(
        { error: "Role and admin ID are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["CLIENT", "DJ", "ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        djProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from changing their own role
    if (user.id === adminId) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // If changing from DJ to CLIENT, we need to handle DJ profile deletion
    if (user.role === "DJ" && role === "CLIENT") {
      // Check if DJ has active bookings
      let activeBookings = [];

      if (user.djProfile?.id) {
        activeBookings = await prisma.booking.findMany({
          where: {
            djId: user.djProfile.id,
            status: {
              in: ["PENDING", "ACCEPTED", "CONFIRMED"],
            },
          },
        });
      }

      console.log("Checking DJ demotion:", {
        userId: (await params).id,
        djProfileId: user.djProfile?.id,
        activeBookingsCount: activeBookings.length,
        activeBookings: activeBookings.map((b) => ({
          id: b.id,
          status: b.status,
        })),
      });

      if (activeBookings.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot demote DJ with active bookings. Please handle existing bookings first.",
          },
          { status: 400 }
        );
      }

      // Delete DJ profile first
      if (user.djProfile) {
        await prisma.djProfile.delete({
          where: { userId: (await params).id },
        });
      }

      // Update the user's role
      const updatedUser = await prisma.user.update({
        where: { id: (await params).id },
        data: {
          role: role as any, // Type assertion for Prisma enum
        },
      });

      // Create notification for the demoted DJ
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "DJ_DEMOTED",
          title: "DJ Profile Removed",
          message: `Your DJ profile has been removed and your role changed to ${role}.`,
          isRead: false,
        },
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
      });
    }

    // Regular role change (not DJ demotion)
    const updatedUser = await prisma.user.update({
      where: { id: (await params).id },
      data: {
        role: role as any, // Type assertion for Prisma enum
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "ROLE_CHANGED",
        title: "Role Updated",
        message: `Your role has been changed to ${role}.`,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    return NextResponse.json(
      { error: "Failed to change user role" },
      { status: 500 }
    );
  }
}
