import { PrismaClient, Role } from "../app/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  console.log("🧹 Cleaning up existing data...");

  // Delete existing data in reverse dependency order
  await prisma.djAddon.deleteMany({});
  await prisma.djEventPricing.deleteMany({});
  await prisma.djMix.deleteMany({});
  await prisma.djYouTubeVideo.deleteMany({});
  await prisma.eventPhoto.deleteMany({});
  await prisma.bookingRecovery.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.commentLike.deleteMany({});
  await prisma.commentDislike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.mixLike.deleteMany({});
  await prisma.repost.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.userMedia.deleteMany({});
  await prisma.securityClearance.deleteMany({});
  await prisma.djProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🌱 Starting fresh database seeding...");

  // Create admin user (Babajide Ogunbanjo with stage name JAY BABA)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jaybaba@prodj.com";
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: "Babajide Ogunbanjo",
      password: hashedPassword,
      role: Role.ADMIN,
      status: "ACTIVE",
      agreedToTerms: true,
      agreedToPrivacy: true,
      termsAgreedAt: new Date(),
      privacyAgreedAt: new Date(),
      termsVersion: "1.0",
      privacyVersion: "1.0",
    },
  });

  // Create admin DJ profile
  await prisma.djProfile.create({
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

  console.log("✅ Admin user created:", {
    email: admin.email,
    name: admin.name,
    stageName: "JAY BABA",
    role: admin.role,
  });

  console.log(`✅ Admin user created: ${admin.name} (${admin.email})`);

  // Create test client user
  const CLIENT_PASSWORD = "password";
  const CLIENT_EMAIL = "imani@test.com";
  const clientHashedPassword = await bcrypt.hash(CLIENT_PASSWORD, 10);

  const client = await prisma.user.create({
    data: {
      email: CLIENT_EMAIL,
      name: "Imani Hamilton",
      password: clientHashedPassword,
      role: Role.CLIENT,
      status: "ACTIVE",
      agreedToTerms: true,
      agreedToPrivacy: true,
      termsAgreedAt: new Date(),
      privacyAgreedAt: new Date(),
      termsVersion: "1.0",
      privacyVersion: "1.0",
    },
  });

  console.log("✅ Client user created:", {
    email: client.email,
    name: client.name,
    role: client.role,
  });

  // Test DJs data - only the 4 requested
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

      eventsOffered: [
        "Wedding",
        "Club",
        "Corporate",
        "Birthday",
        "Private Party",
      ],
    },
    {
      email: "djsb@test.com",
      name: "DJ SB",
      password: "password",
      stageName: "DJ SB",
      genres: ["House", "Techno", "EDM", "Pop"],
      bio: "Versatile DJ with expertise in House, Techno, and EDM. Creates energetic atmospheres perfect for clubs, corporate events, and private parties. Known for seamless transitions and crowd control.",
      experience: 6,
      location: "Los Angeles, CA",
      travelRadius: 80,

      eventsOffered: ["Club", "Corporate", "Private Party"],
    },
    {
      email: "jamiedred@test.com",
      name: "Jamie Dred",
      password: "password",
      stageName: "JAMIE DRED",
      genres: ["House", "Techno", "EDM"],
      bio: "International DJ specializing in House and Techno music. Has performed at major clubs and festivals worldwide. Creates immersive electronic music experiences.",
      experience: 8,
      location: "London, UK",
      travelRadius: 100,

      eventsOffered: ["Club", "Corporate", "Private Party"],
    },
    {
      email: "djto@test.com",
      name: "DJ T.O",
      password: "password",
      stageName: "DJ T.O",
      genres: ["R&B", "Hip Hop", "Reggae", "Pop"],
      bio: "Versatile DJ with expertise in R&B, Hip Hop, and Reggae. Perfect for weddings, corporate events, and private parties. Known for reading the crowd and adapting music selection.",
      experience: 6,
      location: "Toronto, Canada",
      travelRadius: 75,

      eventsOffered: ["Wedding", "Birthday", "Private Party", "Corporate"],
    },
  ];

  // Create test DJs
  for (const djData of testDjs) {
    const hashedPassword = await bcrypt.hash(djData.password, 10);

    const dj = await prisma.user.create({
      data: {
        email: djData.email,
        name: djData.name,
        password: hashedPassword,
        role: Role.DJ,
        status: "ACTIVE",
        agreedToTerms: true,
        agreedToPrivacy: true,
        termsAgreedAt: new Date(),
        privacyAgreedAt: new Date(),
        termsVersion: "1.0",
        privacyVersion: "1.0",
      },
    });

    // Create DJ profile
    await prisma.djProfile.create({
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
        rating: Math.floor(Math.random() * 20) / 10 + 4.0, // Random rating between 4.0-5.9
        totalBookings: Math.floor(Math.random() * 50) + 10, // Random bookings between 10-59
      },
    });

    console.log(`✅ DJ created: ${djData.stageName} (${djData.email})`);
  }

  // Grant subscriptions to all seeded DJs
  console.log("🎫 Granting subscriptions to seeded DJs...");

  const seededDjs = await prisma.user.findMany({
    where: {
      role: Role.DJ,
      email: {
        in: testDjs.map((dj) => dj.email),
      },
    },
  });

  console.log(`✅ Created ${seededDjs.length} DJ users with profiles`);

  console.log("🎉 Database seeding completed successfully!");
  console.log("📊 Summary:");
  console.log(`   - Admin: ${admin.email} (${admin.name}) - Stage: JAY BABA`);
  console.log(`   - Client: ${client.email} (${client.name})`);
  console.log(`   - Test DJs: ${seededDjs.length} users created`);
  console.log(
    "   - DJs: OSEAN, DJ Sarah Spins, DJ MikeR, DJ Alex Beats, DJ T.O"
  );
  console.log();
  console.log("🔑 Login credentials:");
  console.log("   - Admin: Use your ADMIN_EMAIL and ADMIN_PASSWORD from .env");
  console.log("   - All test users: password is 'password'");
  console.log();
  console.log(
    "💡 Note: Use Pro-DJ centralized pricing instead of individual DJ rates"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
