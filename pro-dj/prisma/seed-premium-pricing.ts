import { PrismaClient } from "../app/generated/prisma/index.js";

const prisma = new PrismaClient();

async function seedPremiumPricing() {
  console.log("🎵 Seeding Pro-DJ Premium Service Pricing...");

  // Create standardized service pricing
  const servicePricing = [
    {
      eventType: "Wedding",
      packageType: "BASIC",
      packageName: "Wedding Basic Package",
      basePriceCents: 200000, // $2,000 - 5-hour package
      regionMultiplier: 1.3, // Higher multiplier for premium markets
      durationHours: 5,
      description:
        "Complete wedding coverage including ceremony, cocktail hour, and reception. Includes microphones for officiant and toasts, reception coordination as MC, and planning consultation.",
      includes: [
        "5 hours of coverage",
        "Ceremony, cocktail hour & reception",
        "Microphones for officiant & toasts",
        "Reception coordination as MC",
        "Planning consultation",
        "Professional sound system",
        "Basic lighting setup",
      ],
    },
    {
      eventType: "Wedding",
      packageType: "PREMIUM",
      packageName: "Wedding Premium Package",
      basePriceCents: 320000, // $3,200 - 8-hour package
      regionMultiplier: 1.3,
      durationHours: 8,
      description:
        "Full-day wedding experience with extended coverage and premium services. Perfect for larger weddings and those wanting extra time for setup and coordination.",
      includes: [
        "8 hours of coverage",
        "Ceremony, cocktail hour & reception",
        "Microphones for officiant & toasts",
        "Reception coordination as MC",
        "Extended planning consultation",
        "Premium sound system",
        "Enhanced lighting setup",
        "Setup & teardown included",
        "Backup equipment",
        "Custom playlist creation",
      ],
    },
    {
      eventType: "Corporate",
      packageType: "BASIC",
      packageName: "Corporate Standard Package",
      basePricePerHour: 35000, // $350/hour - Competitive corporate pricing
      regionMultiplier: 1.2, // Higher multiplier for corporate clients
      minimumHours: 4,
      durationHours: 4,
      description:
        "Premium corporate event DJ service for meetings, conferences, and company parties with professional presentation and coordination",
      includes: [
        "4 hours of coverage",
        "Professional sound system",
        "Microphones included",
        "Event coordination",
        "Music consultation",
        "Setup & breakdown"
      ]
    },
    {
      eventType: "Birthday",
      basePricePerHour: 25000, // $250/hour - Competitive birthday pricing
      regionMultiplier: 1.0,
      minimumHours: 4,
      description:
        "Premium birthday party DJ service for all ages with personalized music selection and party coordination",
    },
    {
      eventType: "Private Party",
      basePricePerHour: 30000, // $300/hour - Competitive private party pricing
      regionMultiplier: 1.1, // Slightly higher multiplier for premium private events
      minimumHours: 4,
      description:
        "Premium private party DJ service for intimate gatherings with personalized music selection and professional coordination",
    },
    {
      eventType: "Club",
      basePricePerHour: 25000, // $250/hour - Base rate for clubs (they have their own equipment)
      regionMultiplier: 1.0,
      minimumHours: 3,
      description:
        "Professional club DJ service with high-energy performance - base rate since venues provide lighting and equipment",
    },
    {
      eventType: "Graduation",
      basePricePerHour: 16000, // $160/hour
      regionMultiplier: 1.0,
      minimumHours: 4,
      description: "Graduation party DJ service",
    },
    {
      eventType: "Anniversary",
      basePricePerHour: 17000, // $170/hour
      regionMultiplier: 1.0,
      minimumHours: 4,
      description: "Anniversary celebration DJ service",
    },
    {
      eventType: "Holiday Party",
      basePricePerHour: 19000, // $190/hour
      regionMultiplier: 1.1,
      minimumHours: 4,
      description: "Holiday party DJ service for festive celebrations",
    },
  ];

  // Create Pro-DJ add-ons
  const addons = [
    // Lighting
    {
      name: "Premium Lighting Package",
      description:
        "Professional LED uplighting, spotlights, and ambient lighting",
      priceFixed: 35000, // $350
      category: "Lighting",
      requiresSpecialEquipment: true,
    },
    {
      name: "Basic Lighting Enhancement",
      description: "Colorful LED strips and party lighting",
      priceFixed: 15000, // $150
      category: "Lighting",
      requiresSpecialEquipment: false,
    },
    {
      name: "Dance Floor Lighting",
      description: "Dedicated dance floor lighting with beat-synced effects",
      priceFixed: 25000, // $250
      category: "Lighting",
      requiresSpecialEquipment: true,
    },

    // Sound
    {
      name: "Premium Sound System",
      description: "High-end speakers and subwoofers for large venues",
      priceFixed: 50000, // $500
      category: "Sound",
      requiresSpecialEquipment: true,
    },
    {
      name: "Wireless Microphone Package",
      description:
        "Professional wireless microphones for speeches and announcements",
      priceFixed: 10000, // $100
      category: "Sound",
      requiresSpecialEquipment: false,
    },

    // Entertainment
    {
      name: "Karaoke Setup",
      description: "Professional karaoke system with song library",
      priceFixed: 20000, // $200
      category: "Entertainment",
      requiresSpecialEquipment: true,
    },
    {
      name: "Photo Booth Integration",
      description: "Music coordination with photo booth services",
      priceFixed: 15000, // $150
      category: "Entertainment",
      requiresSpecialEquipment: false,
    },

    // Special Effects
    {
      name: "Fog Machine & Effects",
      description: "Professional fog machine with lighting effects",
      priceFixed: 12000, // $120
      category: "Special Effects",
      requiresSpecialEquipment: true,
    },
    {
      name: "Confetti Cannons",
      description: "Timed confetti cannons for special moments",
      priceFixed: 8000, // $80
      category: "Special Effects",
      requiresSpecialEquipment: true,
    },

    // Equipment
    {
      name: "Extended Setup Time",
      description: "Additional setup time for complex events",
      pricePerHour: 5000, // $50/hour
      category: "Equipment",
      requiresSpecialEquipment: false,
    },
    {
      name: "Backup Equipment",
      description: "Full backup sound system for mission-critical events",
      priceFixed: 30000, // $300
      category: "Equipment",
      requiresSpecialEquipment: true,
    },

    // Premium Wedding & Corporate Add-ons
    {
      name: "Wedding Planning Consultation",
      description: "Pre-event consultation for timeline and music selection",
      priceFixed: 15000, // $150
      category: "Consultation",
      requiresSpecialEquipment: false,
    },
    {
      name: "Ceremony & Reception Package",
      description: "Complete coverage for both ceremony and reception",
      priceFixed: 25000, // $250
      category: "Wedding Services",
      requiresSpecialEquipment: true,
    },
    {
      name: "Corporate Presentation Support",
      description: "Professional audio support for corporate presentations",
      priceFixed: 20000, // $200
      category: "Corporate Services",
      requiresSpecialEquipment: true,
    },
    {
      name: "Custom Playlist Creation",
      description: "Personalized playlist creation and consultation",
      priceFixed: 10000, // $100
      category: "Consultation",
      requiresSpecialEquipment: false,
    },
    {
      name: "Multi-Language MC Service",
      description: "Professional MC service in multiple languages",
      priceFixed: 30000, // $300
      category: "MC Services",
      requiresSpecialEquipment: false,
    },
    {
      name: "Live Music Coordination",
      description: "Coordination with live musicians or bands",
      priceFixed: 20000, // $200
      category: "Coordination",
      requiresSpecialEquipment: false,
    },

    // Additional Services from Competitor Analysis
    {
      name: "Wireless Decor Uplighting",
      description: "Professional wireless LED uplighting for venue ambiance",
      priceFixed: 40000, // $400
      category: "Lighting",
      requiresSpecialEquipment: true,
    },
    {
      name: "Photo Booth Integration",
      description: "Complete photo booth setup with music coordination",
      priceFixed: 35000, // $350
      category: "Entertainment",
      requiresSpecialEquipment: true,
    },
    {
      name: "Digital Monogram",
      description: "Custom digital monogram projection for special moments",
      priceFixed: 15000, // $150
      category: "Special Effects",
      requiresSpecialEquipment: true,
    },
    {
      name: "Projector & Slideshow",
      description: "Professional projector setup for slideshows and videos",
      priceFixed: 25000, // $250
      category: "Equipment",
      requiresSpecialEquipment: true,
    },
    {
      name: "Karaoke Setup",
      description: "Professional karaoke system with song library",
      priceFixed: 20000, // $200
      category: "Entertainment",
      requiresSpecialEquipment: true,
    },
    {
      name: "Song Customization",
      description: "Custom song editing and remixing for special moments",
      priceFixed: 10000, // $100
      category: "Consultation",
      requiresSpecialEquipment: false,
    },
  ];

  try {
    // Seed service pricing
    for (const pricing of servicePricing) {
          await prisma.proDjServicePricing.upsert({
      where: { 
        eventType_packageType: {
          eventType: pricing.eventType,
          packageType: pricing.packageType
        }
      },
      update: pricing,
      create: pricing,
    });
    }

    console.log(`✅ Created ${servicePricing.length} service pricing entries`);

    // Seed add-ons (prevent duplicates)
    for (const addon of addons) {
      // Check if addon already exists by name
      const existing = await prisma.proDjAddon.findFirst({
        where: {
          name: addon.name,
          category: addon.category,
        },
      });

      if (!existing) {
        await prisma.proDjAddon.create({
          data: addon,
        });
      }
    }

    console.log(`✅ Created ${addons.length} Pro-DJ add-ons`);

    console.log("🎉 Premium pricing seeded successfully!");

    // Summary
    console.log("\n📊 PRICING SUMMARY:");
    console.log(
      "Event Types:",
      servicePricing.map((p) => p.eventType).join(", ")
    );
    console.log(
      "Add-on Categories:",
      [...new Set(addons.map((a) => a.category))].join(", ")
    );
    console.log("Total Add-ons:", addons.length);
  } catch (error) {
    console.error("❌ Error seeding premium pricing:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPremiumPricing().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedPremiumPricing };
