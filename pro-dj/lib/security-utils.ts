import crypto from "crypto";

// Security utilities for handling sensitive tax information
// These functions should only be used by authorized admin functions

const ENCRYPTION_KEY =
  process.env.TAX_DATA_ENCRYPTION_KEY || "development-key-change-in-production";
const ALGORITHM = "aes-256-gcm";

/**
 * Encrypts sensitive tax ID information
 */
export function encryptTaxId(taxId: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  if (!taxId) throw new Error("Tax ID is required for encryption");

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from("tax-id", "utf8"));

  let encrypted = cipher.update(taxId, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

/**
 * Decrypts sensitive tax ID information
 */
export function decryptTaxId(
  encryptedData: string,
  iv: string,
  tag: string
): string {
  if (!encryptedData || !iv || !tag) {
    throw new Error("Invalid encryption data provided");
  }

  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from("tax-id", "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Gets the last 4 digits of a tax ID for display purposes
 */
export function getTaxIdLastFour(taxId: string): string {
  if (!taxId) return "";

  // Remove any formatting characters
  const cleanTaxId = taxId.replace(/[^0-9]/g, "");

  if (cleanTaxId.length < 4) return cleanTaxId;

  return cleanTaxId.slice(-4);
}

/**
 * Validates tax ID format (basic validation)
 */
export function validateTaxId(taxId: string, type: "SSN" | "EIN"): boolean {
  if (!taxId) return false;

  const cleanTaxId = taxId.replace(/[^0-9]/g, "");

  if (type === "SSN") {
    // SSN format: 9 digits
    return cleanTaxId.length === 9;
  } else if (type === "EIN") {
    // EIN format: 9 digits
    return cleanTaxId.length === 9;
  }

  return false;
}

/**
 * Determines if a tax ID is SSN or EIN based on format
 */
export function determineTaxIdType(taxId: string): "SSN" | "EIN" | "UNKNOWN" {
  if (!taxId) return "UNKNOWN";

  const cleanTaxId = taxId.replace(/[^0-9]/g, "");

  if (cleanTaxId.length === 9) {
    // Both SSN and EIN are 9 digits - need additional context
    // EINs typically start with certain prefixes
    const firstTwo = cleanTaxId.substring(0, 2);
    const einPrefixes = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "30",
      "31",
      "32",
      "33",
      "34",
      "35",
      "36",
      "37",
      "38",
      "39",
      "40",
      "41",
      "42",
      "43",
      "44",
      "45",
      "46",
      "47",
      "48",
      "50",
      "51",
      "52",
      "53",
      "54",
      "55",
      "56",
      "57",
      "58",
      "59",
      "60",
      "61",
      "62",
      "63",
      "64",
      "65",
      "66",
      "67",
      "68",
      "71",
      "72",
      "73",
      "74",
      "75",
      "76",
      "77",
      "80",
      "81",
      "82",
      "83",
      "84",
      "85",
      "86",
      "87",
      "88",
      "90",
      "91",
      "92",
      "93",
      "94",
      "95",
      "98",
      "99",
    ];

    if (einPrefixes.includes(firstTwo)) {
      return "EIN";
    } else {
      return "SSN";
    }
  }

  return "UNKNOWN";
}

/**
 * Sanitizes tax ID for logging (shows only last 4 digits)
 */
export function sanitizeTaxIdForLogging(taxId: string): string {
  if (!taxId) return "N/A";

  const lastFour = getTaxIdLastFour(taxId);
  return `****-**-${lastFour}`;
}

/**
 * Audit log entry for tax data access
 */
export interface TaxDataAccessLog {
  userId: string;
  accessedBy: string;
  accessType: "VIEW" | "CREATE" | "UPDATE" | "DELETE";
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  dataFields: string[];
}

/**
 * Log access to sensitive tax data for audit purposes
 */
export function logTaxDataAccess(accessLog: TaxDataAccessLog): void {
  // In production, this should write to a secure audit log
  // For now, we'll just console.log with proper formatting
  console.log("[SECURITY_AUDIT]", {
    timestamp: accessLog.timestamp.toISOString(),
    type: "TAX_DATA_ACCESS",
    userId: accessLog.userId,
    accessedBy: accessLog.accessedBy,
    accessType: accessLog.accessType,
    ipAddress: accessLog.ipAddress,
    dataFields: accessLog.dataFields,
    userAgent: accessLog.userAgent,
  });
}

/**
 * Check if user has permission to access tax data
 */
export function hasSecurityClearance(
  userRole: string,
  targetUserId: string,
  currentUserId: string
): boolean {
  // Admin users can access any tax data
  if (userRole === "ADMIN") {
    return true;
  }

  // Users can only access their own tax data
  if (targetUserId === currentUserId) {
    return true;
  }

  return false;
}

/**
 * Generate data retention date based on compliance requirements
 */
export function calculateDataRetentionDate(createdAt: Date): Date {
  // IRS requires keeping tax records for at least 7 years
  // We'll set retention to 8 years to be safe
  const retentionDate = new Date(createdAt);
  retentionDate.setFullYear(retentionDate.getFullYear() + 8);
  return retentionDate;
}
