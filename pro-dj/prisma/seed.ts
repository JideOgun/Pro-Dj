import { PrismaClient, Role } from "../app/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "defaultPassword";
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: Role.ADMIN },
    create: {
      email: ADMIN_EMAIL,
      name: "Jay Baba",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // Create a test client user
  const CLIENT_PASSWORD = "password";
  const CLIENT_EMAIL = "adefreshkid@icloud.com";
  const clientHashedPassword = await bcrypt.hash(CLIENT_PASSWORD, 10);

  const client = await prisma.user.upsert({
    where: { email: CLIENT_EMAIL },
    update: { role: Role.CLIENT },
    create: {
      email: CLIENT_EMAIL,
      name: "Test Client",
      password: clientHashedPassword,
      role: Role.CLIENT,
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
        priceCents: 50000,
        sortOrder: 1,
      },
      {
        type: "Wedding",
        key: "gold",
        label: "Gold Package",
        priceCents: 75000,
        sortOrder: 2,
      },
      {
        type: "Wedding",
        key: "platinum",
        label: "Platinum Package",
        priceCents: 100000,
        sortOrder: 3,
      },

      // Club packages
      {
        type: "Club",
        key: "2hr",
        label: "2 Hours",
        priceCents: 20000,
        sortOrder: 1,
      },
      {
        type: "Club",
        key: "3hr",
        label: "3 Hours",
        priceCents: 30000,
        sortOrder: 2,
      },
      {
        type: "Club",
        key: "4hr",
        label: "4 Hours",
        priceCents: 40000,
        sortOrder: 3,
      },

      // Corporate Event packages
      {
        type: "Corporate",
        key: "halfday",
        label: "Half Day",
        priceCents: 60000,
        sortOrder: 1,
      },
      {
        type: "Corporate",
        key: "fullday",
        label: "Full Day",
        priceCents: 120000,
        sortOrder: 2,
      },

      // Private Party Packages
      {
        type: "Private Party",
        key: "private_basic",
        label: "Basic Private Party (3 hours)",
        priceCents: 30000,
        sortOrder: 1,
        isActive: true,
      },
      {
        type: "Private Party",
        key: "private_vip",
        label: "VIP Private Party (5 hours, lighting + MC)",
        priceCents: 60000,
        sortOrder: 2,
        isActive: true,
      },

      // Birthday Packages
      {
        type: "Birthday",
        key: "birthday_basic",
        label: "Basic Birthday Package (2 hours)",
        priceCents: 20000,
        sortOrder: 1,
        isActive: true,
      },
      {
        type: "Birthday",
        key: "birthday_premium",
        label: "Premium Birthday Package (4 hours, lighting)",
        priceCents: 40000,
        sortOrder: 2,
        isActive: true,
      },
    ],
  });

  console.log("✅ Pricing seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
