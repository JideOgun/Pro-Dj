import { PrismaClient } from "../app/generated/prisma";
import {
  encryptTaxId,
  getTaxIdLastFour,
  determineTaxIdType,
  calculateDataRetentionDate,
} from "../lib/security-utils";

const prisma = new PrismaClient();

async function migrateTaxData() {
  console.log("Starting migration of tax data to SecurityClearance model...");

  try {
    // Find all users with tax information that needs to be migrated
    const usersWithTaxInfo = await prisma.$queryRaw<
      Array<{
        id: string;
        taxId: string | null;
        businessName: string | null;
        businessAddress: string | null;
        businessPhone: string | null;
        isCorporation: boolean;
        isSoleProprietor: boolean;
        createdAt: Date;
      }>
    >`
      SELECT id, "taxId", "businessName", "businessAddress", "businessPhone", 
             "isCorporation", "isSoleProprietor", "createdAt"
      FROM "User" 
      WHERE "taxId" IS NOT NULL AND "taxId" != ''
    `;

    console.log(
      `Found ${usersWithTaxInfo.length} users with tax information to migrate`
    );

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersWithTaxInfo) {
      try {
        // Check if SecurityClearance already exists for this user
        const existingClearance = await prisma.securityClearance.findUnique({
          where: { userId: user.id },
        });

        if (existingClearance) {
          console.log(
            `User ${user.id} already has SecurityClearance, skipping...`
          );
          continue;
        }

        if (!user.taxId) {
          console.log(`User ${user.id} has no tax ID, skipping...`);
          continue;
        }

        // Encrypt the tax ID
        const { encrypted, iv, tag } = encryptTaxId(user.taxId);
        const encryptedTaxId = `${encrypted}:${iv}:${tag}`;
        const taxIdLastFour = getTaxIdLastFour(user.taxId);
        const taxIdType = determineTaxIdType(user.taxId);

        // Create SecurityClearance record
        await prisma.securityClearance.create({
          data: {
            userId: user.id,
            encryptedTaxId,
            taxIdLastFour,
            taxIdType,
            businessName: user.businessName,
            businessAddress: user.businessAddress,
            businessPhone: user.businessPhone,
            isCorporation: user.isCorporation,
            isSoleProprietor: user.isSoleProprietor,
            businessType: user.isSoleProprietor
              ? "SOLE_PROPRIETOR"
              : user.isCorporation
              ? "CORPORATION"
              : "LLC",
            dataRetentionDate: calculateDataRetentionDate(user.createdAt),
            accessCount: 0,
          },
        });

        migratedCount++;
        console.log(
          `✓ Migrated tax data for user ${user.id} (${taxIdType}: ****${taxIdLastFour})`
        );
      } catch (error) {
        console.error(`✗ Error migrating user ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`  - Successfully migrated: ${migratedCount} users`);
    console.log(`  - Errors: ${errorCount} users`);

    if (migratedCount > 0) {
      console.log(`\n⚠️  IMPORTANT: After verifying the migration:`);
      console.log(
        `   1. The old tax data columns in the User table should be cleared`
      );
      console.log(`   2. Run the cleanup script to remove the old columns`);
      console.log(
        `   3. Update your APIs to use the new SecurityClearance model`
      );
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Cleanup function to remove old tax data (run after verifying migration)
async function cleanupOldTaxData() {
  console.log("Cleaning up old tax data from User table...");

  try {
    // Update all users to clear the old tax data
    const result = await prisma.$executeRaw`
      UPDATE "User" 
      SET "taxId" = NULL,
          "businessName" = NULL,
          "businessAddress" = NULL,
          "businessPhone" = NULL,
          "isCorporation" = false,
          "isSoleProprietor" = true
      WHERE "taxId" IS NOT NULL
    `;

    console.log(`✓ Cleared tax data from ${result} user records`);
    console.log("Old tax data cleanup completed");
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the appropriate function based on command line argument
const command = process.argv[2];

if (command === "migrate") {
  migrateTaxData();
} else if (command === "cleanup") {
  cleanupOldTaxData();
} else {
  console.log("Usage:");
  console.log(
    "  npm run migrate-tax-data migrate  # Migrate tax data to SecurityClearance"
  );
  console.log(
    "  npm run migrate-tax-data cleanup  # Clean up old tax data (after verification)"
  );
  process.exit(1);
}
