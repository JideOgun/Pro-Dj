import { PrismaClient } from "../app/generated/prisma/index.js";

const prisma = new PrismaClient();

async function seedPremiumPricing() {
  console.log("🎵 Seeding Pro-DJ Premium Service Pricing...");

  // First, create all add-ons and get their IDs
  const addonData = [
    // Core Services
    { name: "Professional Sound System", description: "High-quality sound system for events", priceFixed: 0, category: "Core Services" },
    { name: "Wireless Microphone Package", description: "Professional wireless microphones for speeches and announcements", priceFixed: 10000, category: "Sound" },
    { name: "Basic Lighting Setup", description: "Essential lighting for events", priceFixed: 0, category: "Lighting" },
    { name: "Event Coordination", description: "Professional event coordination and MC services", priceFixed: 0, category: "Core Services" },
    { name: "Setup & Breakdown", description: "Complete setup and teardown service", priceFixed: 0, category: "Core Services" },
    
    // Wedding Specific
    { name: "Wedding Planning Consultation", description: "Pre-event consultation for timeline and music selection", priceFixed: 15000, category: "Consultation" },
    { name: "Ceremony & Reception Package", description: "Complete coverage for both ceremony and reception", priceFixed: 25000, category: "Wedding Services" },
    { name: "Extended Planning Consultation", description: "Extended consultation for complex weddings", priceFixed: 25000, category: "Consultation" },
    
    // Premium Services
    { name: "Premium Sound System", description: "High-end speakers and subwoofers for large venues", priceFixed: 50000, category: "Sound" },
    { name: "Wireless Decor Uplighting", description: "Professional wireless LED uplighting for venue ambiance", priceFixed: 40000, category: "Lighting" },
    { name: "Backup Equipment", description: "Full backup sound system for mission-critical events", priceFixed: 30000, category: "Equipment" },
    { name: "Custom Playlist Creation", description: "Personalized playlist creation and consultation", priceFixed: 10000, category: "Consultation" },
    
    // Additional Add-ons
    { name: "Karaoke Setup", description: "Professional karaoke system with song library", priceFixed: 20000, category: "Entertainment" },
    { name: "Photo Booth Integration", description: "Complete photo booth setup with music coordination", priceFixed: 35000, category: "Entertainment" },
    { name: "Digital Monogram", description: "Custom digital monogram projection for special moments", priceFixed: 15000, category: "Special Effects" },
    { name: "Projector & Slideshow", description: "Professional projector setup for slideshows and videos", priceFixed: 25000, category: "Equipment" },
    { name: "Song Customization", description: "Custom song editing and remixing for special moments", priceFixed: 10000, category: "Consultation" },
  ];

  // Create add-ons and store their IDs
  const addonIds: { [key: string]: string } = {};
  
  for (const addon of addonData) {
    const existing = await prisma.proDjAddon.findFirst({
      where: { name: addon.name, category: addon.category },
    });

    let addonId: string;
    if (existing) {
      addonId = existing.id;
    } else {
      const created = await prisma.proDjAddon.create({ data: addon });
      addonId = created.id;
    }
    addonIds[addon.name] = addonId;
  }

  console.log(`✅ Created/found ${Object.keys(addonIds).length} add-ons`);

  // Create standardized service pricing with add-on references
  const servicePricing = [
    {
      eventType: "Wedding",
      packageType: "BASIC",
      packageName: "Wedding Basic Package",
      basePriceCents: 200000, // $2,000 - 5-hour package
      regionMultiplier: 1.3,
      durationHours: 5,
      description: "Complete wedding coverage including ceremony, cocktail hour, and reception. Includes microphones for officiant and toasts, reception coordination as MC, and planning consultation.",
      includedAddonIds: [
        addonIds["Professional Sound System"],
        addonIds["Wireless Microphone Package"],
        addonIds["Basic Lighting Setup"],
        addonIds["Event Coordination"],
        addonIds["Setup & Breakdown"],
        addonIds["Wedding Planning Consultation"],
        addonIds["Ceremony & Reception Package"],
      ],
    },
    {
      eventType: "Wedding",
      packageType: "PREMIUM",
      packageName: "Wedding Premium Package",
      basePriceCents: 320000, // $3,200 - 8-hour package
      regionMultiplier: 1.3,
      durationHours: 8,
      description: "Full-day wedding experience with extended coverage and premium services. Perfect for larger weddings and those wanting extra time for setup and coordination.",
      includedAddonIds: [
        addonIds["Professional Sound System"],
        addonIds["Wireless Microphone Package"],
        addonIds["Basic Lighting Setup"],
        addonIds["Event Coordination"],
        addonIds["Setup & Breakdown"],
        addonIds["Wedding Planning Consultation"],
        addonIds["Ceremony & Reception Package"],
        addonIds["Premium Sound System"],
        addonIds["Wireless Decor Uplighting"],
        addonIds["Backup Equipment"],
        addonIds["Custom Playlist Creation"],
        addonIds["Extended Planning Consultation"],
      ],
    },
    {
      eventType: "Corporate",
      packageType: "BASIC",
      packageName: "Corporate Standard Package",
      basePricePerHour: 35000, // $350/hour - Competitive corporate pricing
      regionMultiplier: 1.2,
      minimumHours: 4,
      durationHours: 4,
      description: "Premium corporate event DJ service for meetings, conferences, and company parties with professional presentation and coordination",
      includedAddonIds: [
        addonIds["Professional Sound System"],
        addonIds["Wireless Microphone Package"],
        addonIds["Basic Lighting Setup"],
        addonIds["Event Coordination"],
        addonIds["Setup & Breakdown"],
      ],
    },
    {
      eventType: "Birthday",
      packageType: "BASIC",
      packageName: "Birthday Standard Package",
      basePricePerHour: 25000, // $250/hour - Competitive birthday pricing
      regionMultiplier: 1.0,
      minimumHours: 4,
      durationHours: 4,
      description: "Premium birthday party DJ service for all ages with personalized music selection and party coordination",
      includedAddonIds: [
        addonIds["Professional Sound System"],
        addonIds["Wireless Microphone Package"],
        addonIds["Basic Lighting Setup"],
        addonIds["Event Coordination"],
        addonIds["Setup & Breakdown"],
      ],
    },
    {
      eventType: "Private Party",
      packageType: "BASIC",
      packageName: "Private Party Standard Package",
      basePricePerHour: 30000, // $300/hour - Competitive private party pricing
      regionMultiplier: 1.1,
      minimumHours: 4,
      durationHours: 4,
      description: "Premium private party DJ service for intimate gatherings with personalized music selection and professional coordination",
      includedAddonIds: [
        addonIds["Professional Sound System"],
        addonIds["Wireless Microphone Package"],
        addonIds["Basic Lighting Setup"],
        addonIds["Event Coordination"],
        addonIds["Setup & Breakdown"],
      ],
    },
    {
      eventType: "Club",
      packageType: "BASIC",
      packageName: "Club Standard Package",
      basePricePerHour: 25000, // $250/hour - Base rate for clubs (they have their own equipment)
      regionMultiplier: 1.0,
      minimumHours: 3,
      durationHours: 3,
      description: "Professional club DJ service with high-energy performance - base rate since venues provide lighting and equipment",
      includedAddonIds: [
        addonIds["Professional Sound System"],
        addonIds["Event Coordination"],
      ],
    },
  ];

  try {
    // Seed service pricing
    for (const pricing of servicePricing) {
      const { includedAddonIds, ...pricingData } = pricing;
      
      const created = await prisma.proDjServicePricing.upsert({
        where: {
          eventType_packageType: {
            eventType: pricing.eventType,
            packageType: pricing.packageType,
          },
        },
        update: pricingData,
        create: pricingData,
      });

      // Connect included add-ons to the pricing package
      if (includedAddonIds && includedAddonIds.length > 0) {
        await prisma.proDjServicePricing.update({
          where: { id: created.id },
          data: {
            proDjAddons: {
              connect: includedAddonIds.map(id => ({ id }))
            }
          }
        });
      }
    }

    console.log(`✅ Created ${servicePricing.length} service pricing entries`);

    console.log("🎉 Premium pricing seeded successfully!");

    // Summary
    console.log("\n📊 PRICING SUMMARY:");
    console.log(
      "Event Types:",
      servicePricing.map((p) => p.eventType).join(", ")
    );
    console.log(
      "Add-on Categories:",
      [...new Set(addonData.map((a) => a.category))].join(", ")
    );
    console.log("Total Add-ons:", addonData.length);
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
