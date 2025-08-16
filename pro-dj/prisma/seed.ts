import { PrismaClient, Role } from "../app/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "defaultPassword";
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      role: Role.ADMIN,
      password: hashedPassword, // Update password too
      status: "ACTIVE", // Ensure admin is active
    },
    create: {
      email: ADMIN_EMAIL,
      name: "Jay Baba",
      password: hashedPassword,
      role: Role.ADMIN,
      status: "ACTIVE", // Ensure admin is active
    },
  });

  console.log("✅ Admin user created/updated:", {
    email: admin.email,
    name: admin.name,
    role: admin.role,
    hasPassword: !!admin.password,
  });

  // Create a test client user
  const CLIENT_PASSWORD = "password";
  const CLIENT_EMAIL = "adefreshkid@icloud.com";
  const clientHashedPassword = await bcrypt.hash(CLIENT_PASSWORD, 10);

  const client = await prisma.user.upsert({
    where: { email: CLIENT_EMAIL },
    update: { 
      role: Role.CLIENT,
      status: "ACTIVE", // Ensure client is active
    },
    create: {
      email: CLIENT_EMAIL,
      name: "Test Client",
      password: clientHashedPassword,
      role: Role.CLIENT,
      status: "ACTIVE", // Ensure client is active
    },
  });

  console.log("✅ Client user created/updated:", {
    email: client.email,
    name: client.name,
    role: client.role,
  });

  const mixCount = await prisma.mix.count();
  if (mixCount === 0) {
    await prisma.mix.createMany({
      data: [
        {
          title: "Piano Therapy",
          description: "Amapiano mix",
          url: "https://youtu.be/SzZinum4DO8?si=PgY6p6EZkt97XJkv",
          tags: ["Amapiano", "Afrobeats"],
        },
        {
          title: "Loverz and Friendz the Mix",
          description: "Soulful blend of love songs",
          url: "https://youtu.be/OwHpjsKT_lc?si=krsHCeBjQlsBv1ab",
          tags: ["Afrobeats"],
        },
      ],
    });

    const postCount = await prisma.post.count();
    if (postCount === 0) {
      await prisma.post.create({
        data: {
          title: "Welcome to proDJ",
          content:
            "This is the official home of Jay Baba. Mixes, events, and booking info will live here. Stay tuned.",
          coverImage: "some cloudinary url",
        },
      });

      console.log("Seed data created successfully. Admin:", {
        email: admin.email,
        name: admin.role,
      });
    }
  }

  // Clear old rows so we don't get duplicates while testing
  await prisma.pricing.deleteMany();

  await prisma.pricing.createMany({
    data: [
      // Wedding packages
      {
        type: "Wedding",
        key: "silver",
        label: "Silver Package",
        priceCents: 15000, // $150/hour
        sortOrder: 1,
        isActive: true,
      },
      {
        type: "Wedding",
        key: "gold",
        label: "Gold Package",
        priceCents: 20000, // $200/hour
        sortOrder: 2,
        isActive: true,
      },
      {
        type: "Wedding",
        key: "platinum",
        label: "Platinum Package",
        priceCents: 25000, // $250/hour
        sortOrder: 3,
        isActive: true,
      },

      // Club packages
      {
        type: "Club",
        key: "basic",
        label: "Basic Club Package",
        priceCents: 10000, // $100/hour
        sortOrder: 1,
        isActive: true,
      },
      {
        type: "Club",
        key: "premium",
        label: "Premium Club Package",
        priceCents: 15000, // $150/hour
        sortOrder: 2,
        isActive: true,
      },
      {
        type: "Club",
        key: "vip",
        label: "VIP Club Package",
        priceCents: 20000, // $200/hour
        sortOrder: 3,
        isActive: true,
      },

      // Corporate Event packages
      {
        type: "Corporate",
        key: "basic",
        label: "Basic Corporate Package",
        priceCents: 12000, // $120/hour
        sortOrder: 1,
        isActive: true,
      },
      {
        type: "Corporate",
        key: "premium",
        label: "Premium Corporate Package",
        priceCents: 18000, // $180/hour
        sortOrder: 2,
        isActive: true,
      },

      // Private Party Packages
      {
        type: "Private Party",
        key: "basic",
        label: "Basic Private Party Package",
        priceCents: 8000, // $80/hour
        sortOrder: 1,
        isActive: true,
      },
      {
        type: "Private Party",
        key: "premium",
        label: "Premium Private Party Package",
        priceCents: 12000, // $120/hour
        sortOrder: 2,
        isActive: true,
      },

      // Birthday Packages
      {
        type: "Birthday",
        key: "basic",
        label: "Basic Birthday Package",
        priceCents: 6000, // $60/hour
        sortOrder: 1,
        isActive: true,
      },
      {
        type: "Birthday",
        key: "premium",
        label: "Premium Birthday Package",
        priceCents: 10000, // $100/hour
        sortOrder: 2,
        isActive: true,
      },
    ],
  });

  console.log("✅ Pricing seeded successfully");

  // Create test DJs
  const testDjs = [
    {
      email: "osean@test.com",
      name: "OSEAN",
      password: "password",
      stageName: "OSEAN",
      genres: ["Afrobeats", "Amapiano", "Hip Hop"],
      bio: "Professional DJ with 5+ years of experience in Afrobeats and Amapiano. Known for high-energy performances and crowd engagement.",
      experience: 5,
      location: "Lagos, Nigeria",
      travelRadius: 50,
      basePriceCents: 25000,
    },
    {
      email: "jamiedred@test.com",
      name: "JAMIE DRED",
      password: "password",
      stageName: "JAMIE DRED",
      genres: ["House", "Techno", "EDM"],
      bio: "International DJ specializing in House and Techno music. Has performed at major clubs and festivals worldwide.",
      experience: 8,
      location: "London, UK",
      travelRadius: 100,
      basePriceCents: 35000,
    },
    {
      email: "djto@test.com",
      name: "DJ T.O",
      password: "password",
      stageName: "DJ T.O",
      genres: ["R&B", "Hip Hop", "Reggae"],
      bio: "Versatile DJ with expertise in R&B, Hip Hop, and Reggae. Perfect for weddings, corporate events, and private parties.",
      experience: 6,
      location: "Toronto, Canada",
      travelRadius: 75,
      basePriceCents: 30000,
    },
  ];

  for (const djData of testDjs) {
    const hashedPassword = await bcrypt.hash(djData.password, 10);

    const dj = await prisma.user.upsert({
      where: { email: djData.email },
      update: {
        role: Role.DJ,
        name: djData.name,
        password: hashedPassword,
        status: "ACTIVE", // Set existing DJs as active
      },
      create: {
        email: djData.email,
        name: djData.name,
        password: hashedPassword,
        role: Role.DJ,
        status: "ACTIVE", // Set new DJs as active
      },
    });

    // Create DJ profile
    await prisma.djProfile.upsert({
      where: { userId: dj.id },
      update: {
        stageName: djData.stageName,
        genres: djData.genres,
        bio: djData.bio,
        experience: djData.experience,
        location: djData.location,
        travelRadius: djData.travelRadius,
        basePriceCents: djData.basePriceCents,
        isVerified: true, // Mark existing DJs as verified
        isActive: true, // Mark existing DJs as active
      },
      create: {
        userId: dj.id,
        stageName: djData.stageName,
        genres: djData.genres,
        bio: djData.bio,
        experience: djData.experience,
        location: djData.location,
        travelRadius: djData.travelRadius,
        basePriceCents: djData.basePriceCents,
        isVerified: true, // Mark new DJs as verified
        isActive: true, // Mark new DJs as active
      },
    });

    console.log(`✅ DJ created: ${djData.stageName} (${djData.email})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
