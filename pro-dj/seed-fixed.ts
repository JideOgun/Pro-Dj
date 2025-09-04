import { PrismaClient, Role } from "./app/generated/prisma/index.js";
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

  // Create JAY BABA DJ profile for admin
  const jayBabaProfile = await prisma.djProfile.create({
    data: {
      userId: admin.id,
      stageName: "JAY BABA",
      bio: "Founder of Pro-DJ and experienced DJ with a passion for creating memorable musical experiences. Specializes in high-end events and brand collaborations.",
      genres: ["Afrobeats", "Hip Hop", "R&B", "Pop", "House"],
      experience: 8,
      location: "Los Angeles, CA",
      travelRadius: 100,
      portfolio: [],
      languages: ["English"],
      equipment:
        "Premium sound systems, lighting equipment, wireless microphones",
      specialties:
        "Luxury events, brand partnerships, multicultural celebrations",
      isFeatured: true,
    },
  });

  console.log(`✅ Created admin user: ${admin.name} (${admin.email})`);
  console.log(`✅ Created DJ profile: ${jayBabaProfile.stageName}`);

  // Test DJs array
  const testDjs = [
    {
      email: "osean@test.com",
      name: "Osean",
      password: "password",
      stageName: "OSEAN",
      genres: ["Afrobeats", "Amapiano", "Hip Hop"],
      bio: "Rising star in the Afrobeats scene with exceptional mixing skills and crowd energy. Perfect for cultural celebrations and modern events.",
      experience: 4,
      location: "Atlanta, GA",
      specialties: "Afrobeats, cultural events, youth celebrations",
      isFeatured: true,
    },
    {
      email: "sarah@test.com",
      name: "Sarah Johnson",
      password: "password",
      stageName: "DJ Sarah Spins",
      genres: ["Pop", "Electronic", "House"],
      bio: "Electronic music specialist with a flair for creating high-energy dance experiences. Known for seamless transitions and crowd engagement.",
      experience: 5,
      location: "Miami, FL",
      specialties: "Club events, electronic music, dance parties",
      isFeatured: false,
    },
    {
      email: "mike@test.com",
      name: "Mike Rodriguez",
      password: "password",
      stageName: "DJ MikeR",
      genres: ["Latin", "Reggaeton", "Pop"],
      bio: "Latin music expert bringing authentic rhythms and modern beats together. Specializes in bilingual events and cultural celebrations.",
      experience: 7,
      location: "Los Angeles, CA",
      specialties: "Latin events, bilingual celebrations, weddings",
      isFeatured: true,
    },
    {
      email: "alex@test.com",
      name: "Alex Thompson",
      password: "password",
      stageName: "DJ Alex Beats",
      genres: ["Hip Hop", "R&B", "Funk"],
      bio: "Hip Hop purist with deep knowledge of music history and exceptional scratching skills. Perfect for authentic urban events.",
      experience: 9,
      location: "New York, NY",
      specialties: "Hip Hop events, urban celebrations, live mixing",
      isFeatured: false,
    },
    {
      email: "djto@test.com",
      name: "DJ T.O",
      password: "password",
      stageName: "DJ T.O",
      genres: ["R&B", "Hip Hop", "Reggae", "Pop"],
      bio: "Versatile DJ with expertise in R&B, Hip Hop, and Reggae. Perfect for weddings, corporate events, and private parties. Known for reading the crowd and adapting music selection.",
      experience: 6,
      location: "Toronto, ON",
      specialties: "Weddings, corporate events, versatile music selection",
      isFeatured: true,
    },
  ];

  // Create test DJ users and profiles
  for (const djData of testDjs) {
    const hashedDjPassword = await bcrypt.hash(djData.password, 10);

    const djUser = await prisma.user.create({
      data: {
        email: djData.email,
        name: djData.name,
        password: hashedDjPassword,
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

    const djProfile = await prisma.djProfile.create({
      data: {
        userId: djUser.id,
        stageName: djData.stageName,
        bio: djData.bio,
        genres: djData.genres,
        experience: djData.experience,
        location: djData.location,
        travelRadius: 50,
        portfolio: [],
        languages: ["English"],
        equipment: "Professional DJ equipment, sound system, microphones",
        specialties: djData.specialties,
        isFeatured: djData.isFeatured,
      },
    });

    console.log(`✅ Created DJ: ${djUser.name} (${djData.stageName})`);
  }

  // Create test client users
  const testClients = [
    {
      email: "client1@test.com",
      name: "Emma Wilson",
      password: "password",
    },
    {
      email: "client2@test.com",
      name: "James Davis",
      password: "password",
    },
    {
      email: "client3@test.com",
      name: "Lisa Chen",
      password: "password",
    },
  ];

  for (const clientData of testClients) {
    const hashedClientPassword = await bcrypt.hash(clientData.password, 10);

    const client = await prisma.user.create({
      data: {
        email: clientData.email,
        name: clientData.name,
        password: hashedClientPassword,
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

    console.log(`✅ Created client: ${client.name}`);
  }

  console.log("🎉 Database seeding completed successfully!");
  console.log();
  console.log("👥 Created users:");
  console.log("   • Admin: Babajide Ogunbanjo (JAY BABA)");
  console.log(
    "   • DJs: OSEAN, DJ Sarah Spins, DJ MikeR, DJ Alex Beats, DJ T.O"
  );
  console.log("   • Clients: Emma Wilson, James Davis, Lisa Chen");
  console.log();
  console.log("🔑 All test users password: 'password'");
  console.log("🔑 Admin password: from ADMIN_PASSWORD env variable");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
