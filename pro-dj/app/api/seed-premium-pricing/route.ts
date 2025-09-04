import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check for secret token to prevent unauthorized access
    const { token } = await req.json().catch(() => ({}));
    const expectedToken = process.env.MIGRATION_SECRET_TOKEN;
    
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid seed token." },
        { status: 401 }
      );
    }

    console.log("🎵 Seeding Pro-DJ Premium Service Pricing...");

    // First, create all add-ons and get their IDs
    const addonData = [
      // Core Services
      {
        name: "Professional Sound System",
        description: "High-quality sound system for events",
        priceFixed: 0,
        category: "Core Services",
      },
      {
        name: "Wireless Microphone Package",
        description: "Professional wireless microphones for speeches and announcements",
        priceFixed: 10000,
        category: "Sound",
      },
      {
        name: "Basic Lighting Setup",
        description: "Essential lighting for events",
        priceFixed: 0,
        category: "Lighting",
      },
      {
        name: "Event Coordination",
        description: "Professional event coordination and MC services",
        priceFixed: 0,
        category: "Core Services",
      },
      {
        name: "Setup & Breakdown",
        description: "Complete setup and teardown service",
        priceFixed: 0,
        category: "Core Services",
      },
      // Wedding Specific
      {
        name: "Wedding Planning Consultation",
        description: "Pre-event consultation for timeline and music selection",
        priceFixed: 15000,
        category: "Consultation",
      },
      {
        name: "Ceremony & Reception Coverage",
        description: "Complete coverage for ceremony, cocktail hour, and reception",
        priceFixed: 0,
        category: "Core Services",
      },
      // Premium Add-ons
      {
        name: "Premium Lighting Package",
        description: "Advanced lighting with effects and uplighting",
        priceFixed: 25000,
        category: "Lighting",
      },
      {
        name: "Photo Booth",
        description: "Professional photo booth with props and instant prints",
        priceFixed: 35000,
        category: "Entertainment",
      },
      {
        name: "Fog Machine & Effects",
        description: "Professional fog machine with safety controls",
        priceFixed: 15000,
        category: "Special Effects",
      },
    ];

    // Create add-ons
    const createdAddons = [];
    for (const addon of addonData) {
      // Check if addon already exists
      const existing = await prisma.proDjAddon.findFirst({
        where: { name: addon.name }
      });
      
      if (existing) {
        // Update existing addon
        const updated = await prisma.proDjAddon.update({
          where: { id: existing.id },
          data: addon,
        });
        createdAddons.push(updated);
      } else {
        // Create new addon
        const created = await prisma.proDjAddon.create({
          data: {
            ...addon,
            id: crypto.randomUUID(),
            requiresSpecialEquipment: addon.category === "Special Effects",
          },
        });
        createdAddons.push(created);
      }
    }

    // Create service pricing packages
    const servicePricingData = [
      // Wedding Packages
      {
        eventType: "Wedding",
        packageType: "BASIC",
        packageName: "Basic Wedding Package",
        basePriceCents: 250000, // $2,500
        durationHours: 5,
        description: "Perfect for intimate weddings with ceremony and reception coverage",
        includes: [
          "Professional sound system",
          "Wireless microphone package", 
          "Basic lighting setup",
          "Event coordination",
          "Setup & breakdown",
          "Ceremony & reception coverage"
        ],
      },
      {
        eventType: "Wedding",
        packageType: "PREMIUM",
        packageName: "Premium Wedding Package", 
        basePriceCents: 400000, // $4,000
        durationHours: 8,
        description: "Complete wedding experience with premium services",
        includes: [
          "Professional sound system",
          "Wireless microphone package",
          "Premium lighting package",
          "Event coordination", 
          "Setup & breakdown",
          "Ceremony & reception coverage",
          "Wedding planning consultation"
        ],
      },
      // Corporate Packages
      {
        eventType: "Corporate",
        packageType: "STANDARD",
        packageName: "Corporate Event Package",
        basePriceCents: 200000, // $2,000
        durationHours: 4,
        description: "Professional corporate event service",
        includes: [
          "Professional sound system",
          "Wireless microphone package",
          "Basic lighting setup",
          "Event coordination",
          "Setup & breakdown"
        ],
      },
      // Birthday Packages
      {
        eventType: "Birthday",
        packageType: "STANDARD", 
        packageName: "Birthday Party Package",
        basePriceCents: 150000, // $1,500
        durationHours: 4,
        description: "Fun birthday celebration package",
        includes: [
          "Professional sound system",
          "Basic lighting setup",
          "Event coordination",
          "Setup & breakdown"
        ],
      },
      // Private Party Packages
      {
        eventType: "Private Party",
        packageType: "STANDARD",
        packageName: "Private Party Package", 
        basePriceCents: 180000, // $1,800
        durationHours: 4,
        description: "Private party entertainment package",
        includes: [
          "Professional sound system",
          "Basic lighting setup",
          "Event coordination",
          "Setup & breakdown"
        ],
      },
      // Club Events (Hourly)
      {
        eventType: "Club",
        packageType: "HOURLY",
        packageName: "Club Event Service",
        basePriceCents: 50000, // $500/hour
        durationHours: null, // Hourly rate
        description: "Professional club DJ service",
        includes: [
          "Professional sound system",
          "Basic lighting setup",
          "Event coordination"
        ],
      },
    ];

    // Create service pricing
    const createdPricing = [];
    for (const pricing of servicePricingData) {
      const created = await prisma.proDjServicePricing.upsert({
        where: { 
          eventType_packageType: {
            eventType: pricing.eventType,
            packageType: pricing.packageType
          }
        },
        update: pricing,
        create: {
          ...pricing,
          id: crypto.randomUUID(),
        },
      });
      createdPricing.push(created);
    }

    console.log(`✅ Created ${createdAddons.length} add-ons and ${createdPricing.length} service pricing packages`);

    return NextResponse.json({
      success: true,
      message: "Premium pricing seeded successfully",
      addonsCreated: createdAddons.length,
      pricingCreated: createdPricing.length,
    });

  } catch (error) {
    console.error("Seed error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
