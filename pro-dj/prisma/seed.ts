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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
