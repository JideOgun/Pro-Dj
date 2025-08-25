import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || "jideogun93@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "password";
    const adminName = process.env.ADMIN_NAME || "Babajide Ogunbanjo";

    console.log("🔧 Checking for existing admin user...");

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { role: "ADMIN" }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.email);
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
        admin: existingAdmin,
        action: "none"
      });
    }

    console.log("👑 Creating new admin user...");
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        agreedToTerms: true,
        agreedToPrivacy: true,
        termsAgreedAt: new Date(),
        privacyAgreedAt: new Date(),
        termsVersion: "1.0",
        privacyVersion: "1.0",
      },
    });

    console.log("✅ Admin user created:", admin.email);

    // Create admin DJ profile if it doesn't exist
    const existingDjProfile = await prisma.djProfile.findFirst({
      where: { userId: admin.id }
    });

    if (!existingDjProfile) {
      console.log("🎵 Creating admin DJ profile...");
      const adminDjProfile = await prisma.djProfile.create({
        data: {
          userId: admin.id,
          stageName: adminName,
          genres: ["Afrobeats", "Hip Hop", "Pop", "R&B"],
          bio: "Professional DJ and founder of Pro-DJ platform. Specializing in Afrobeats, Hip Hop, and contemporary hits.",
          experience: 8,
          location: "New York, NY",
          travelRadius: 100,
          eventsOffered: [
            "Wedding",
            "Club",
            "Corporate",
            "Birthday",
            "Private Party",
          ],
          isApprovedByAdmin: true,
          isAcceptingBookings: true,
          isFeatured: false, // Don't feature admin on homepage
          rating: 4.9,
          totalBookings: 150,
        },
      });
      console.log("✅ Admin DJ profile created:", adminDjProfile.stageName);
    }

    // Grant subscription to admin if it doesn't exist
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: admin.id }
    });

    if (!existingSubscription) {
      console.log("💳 Granting admin subscription...");
      const adminExpirationDate = new Date();
      adminExpirationDate.setFullYear(adminExpirationDate.getFullYear() + 1);

      await prisma.subscription.create({
        data: {
          userId: admin.id,
          planType: "DJ_BASIC",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: adminExpirationDate,
          amountCents: 0, // Free for admin
          currency: "usd",
          isInTrial: false,
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: `admin_created_${admin.id}_${Date.now()}`,
          stripeCustomerId: `admin_created_customer_${admin.id}`,
          stripePriceId:
            process.env.STRIPE_DJ_BASIC_PRICE_ID?.replace(/"/g, "") ||
            "admin_created_price",
        },
      });
      console.log("✅ Admin subscription granted");
    }

    console.log("🎉 Admin user setup completed successfully!");

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      action: "created",
      credentials: {
        email: adminEmail,
        password: adminPassword, // This will be shown in the response
      }
    });
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
