import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || "jideogun93@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "password";
    const adminName = process.env.ADMIN_NAME || "Babajide Ogunbanjo";

    console.log("🔧 Restoring production database with admin credentials...");

    // Clean up any existing data first (delete in correct order to avoid foreign key constraints)
    console.log("🧹 Cleaning up existing data...");
    await prisma.subscription.deleteMany({});
    await prisma.djMix.deleteMany({});
    await prisma.djProfile.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("✅ Database cleaned");

    // Create admin user with real credentials
    console.log("👑 Creating admin user...");
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

    // Create admin DJ profile
    console.log("🎵 Creating admin DJ profile...");
    const adminDjProfile = await prisma.djProfile.create({
      data: {
        userId: admin.id,
        stageName: "JAY BABA",
        genres: ["Afrobeats", "Hip Hop", "Pop", "R&B"],
        bio: "Professional DJ and founder of Pro-DJ platform. Specializing in Afrobeats, Hip Hop, and contemporary hits. Creating unforgettable experiences for all types of events.",
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
        isFeatured: true,
        rating: 4.9,
        totalBookings: 150,
      },
    });

    console.log("✅ Admin DJ profile created:", adminDjProfile.stageName);

    // Grant subscription to admin DJ
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
        stripeSubscriptionId: `admin_restored_${admin.id}_${Date.now()}`,
        stripeCustomerId: `admin_restored_customer_${admin.id}`,
        stripePriceId:
          process.env.STRIPE_DJ_BASIC_PRICE_ID?.replace(/"/g, "") ||
          "admin_restored_price",
      },
    });

    console.log("✅ Admin subscription granted");

    // Create test client user
    console.log("👤 Creating test client...");
    const clientPassword = await bcrypt.hash("password", 10);

    const client = await prisma.user.create({
      data: {
        email: "imani@test.com",
        name: "Imani Hamilton",
        password: clientPassword,
        role: "CLIENT",
        status: "ACTIVE",
        agreedToTerms: true,
        agreedToPrivacy: true,
        termsAgreedAt: new Date(),
        privacyAgreedAt: new Date(),
        termsVersion: "1.0",
        privacyVersion: "1.0",
      },
    });

    console.log("✅ Client user created:", client.email);

    // Create test DJs
    console.log("🎧 Creating test DJs...");
    const testDjs = [
      {
        email: "osean@test.com",
        name: "Osean",
        password: "password",
        stageName: "OSEAN",
        genres: ["Afrobeats", "Amapiano", "Hip Hop"],
        bio: "Professional DJ with 5+ years of experience in Afrobeats and Amapiano. Known for high-energy performances and crowd engagement. Perfect for weddings, clubs, and private parties.",
        experience: 5,
        location: "Lagos, Nigeria",
        travelRadius: 50,
        eventsOffered: ["Wedding", "Club", "Birthday", "Private Party"],
      },
      {
        email: "djsb@test.com",
        name: "DJ SB",
        password: "password",
        stageName: "DJ SB",
        genres: ["Hip Hop", "R&B", "Pop"],
        bio: "Versatile DJ specializing in Hip Hop and R&B. Creating the perfect atmosphere for any event with smooth transitions and crowd-pleasing selections.",
        experience: 6,
        location: "Los Angeles, CA",
        travelRadius: 75,
        eventsOffered: ["Wedding", "Club", "Corporate", "Birthday"],
      },
      {
        email: "jamiedred@test.com",
        name: "Jamie Dred",
        password: "password",
        stageName: "JAMIE DRED",
        genres: ["Electronic", "House", "Techno"],
        bio: "Electronic music specialist with a passion for House and Techno. Perfect for clubs, raves, and electronic music events.",
        experience: 7,
        location: "Miami, FL",
        travelRadius: 100,
        eventsOffered: ["Club", "Rave", "Electronic Event"],
      },
      {
        email: "djto@test.com",
        name: "DJ T.O",
        password: "password",
        stageName: "DJ T.O",
        genres: ["Afrobeats", "Hip Hop", "Reggae"],
        bio: "International DJ with expertise in Afrobeats and Caribbean music. Bringing global vibes to every event.",
        experience: 4,
        location: "Toronto, Canada",
        travelRadius: 60,
        eventsOffered: ["Wedding", "Club", "Cultural Event", "Private Party"],
      },
    ];

    for (const djData of testDjs) {
      console.log(`🎵 Creating DJ: ${djData.stageName}`);

      const djPassword = await bcrypt.hash(djData.password, 10);

      const dj = await prisma.user.create({
        data: {
          email: djData.email,
          name: djData.name,
          password: djPassword,
          role: "DJ",
          status: "ACTIVE",
          agreedToTerms: true,
          agreedToPrivacy: true,
          termsAgreedAt: new Date(),
          privacyAgreedAt: new Date(),
          termsVersion: "1.0",
          privacyVersion: "1.0",
        },
      });

      const djProfile = await prisma.djProfile.create({
        data: {
          userId: dj.id,
          stageName: djData.stageName,
          genres: djData.genres,
          bio: djData.bio,
          experience: djData.experience,
          location: djData.location,
          travelRadius: djData.travelRadius,
          eventsOffered: djData.eventsOffered,
          isApprovedByAdmin: true,
          isAcceptingBookings: true,
          isFeatured: false,
          rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
          totalBookings: Math.floor(Math.random() * 50) + 10, // Random bookings 10-60
        },
      });

      // Grant subscription to test DJ
      const djExpirationDate = new Date();
      djExpirationDate.setFullYear(djExpirationDate.getFullYear() + 1);

      await prisma.subscription.create({
        data: {
          userId: dj.id,
          planType: "DJ_BASIC",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: djExpirationDate,
          amountCents: 0, // Free for test DJs
          currency: "usd",
          isInTrial: false,
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: `test_dj_${dj.id}_${Date.now()}`,
          stripeCustomerId: `test_dj_customer_${dj.id}`,
          stripePriceId:
            process.env.STRIPE_DJ_BASIC_PRICE_ID?.replace(/"/g, "") ||
            "test_dj_price",
        },
      });

      console.log(`✅ DJ ${djData.stageName} created and subscribed`);
    }

    console.log("🎉 Production database restoration completed successfully!");

    return NextResponse.json({
      success: true,
      message: "Database restored successfully",
      adminCredentials: {
        email: adminEmail,
        password: adminPassword, // This will be shown in the response
      },
      testUsers: {
        client: "imani@test.com / password",
        djs: [
          "osean@test.com",
          "djsb@test.com",
          "jamiedred@test.com",
          "djto@test.com",
        ].map((email) => `${email} / password`),
      },
      usersCreated: 6, // admin + client + 4 DJs
    });
  } catch (error) {
    console.error("❌ Error restoring production:", error);
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
