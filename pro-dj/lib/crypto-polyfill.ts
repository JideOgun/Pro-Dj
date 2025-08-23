// Crypto polyfill to work around webpack bundling issues
let cryptoModule: any;

// Try to get the crypto module in different ways
if (typeof window === "undefined") {
  // Server-side
  try {
    // Try node:crypto first (newer Node.js)
    cryptoModule = require("node:crypto");
  } catch (error) {
    try {
      // Fallback to regular crypto
      cryptoModule = require("crypto");
    } catch (error2) {
      // Last resort - use global crypto if available
      cryptoModule = global.crypto || global.require?.("crypto");
    }
  }
} else {
  // Client-side - use Web Crypto API
  cryptoModule = window.crypto;
}

// Export the crypto functions we need
export const randomBytes =
  cryptoModule?.randomBytes ||
  (() => {
    throw new Error("randomBytes not available");
  });

export const pbkdf2Sync =
  cryptoModule?.pbkdf2Sync ||
  (() => {
    throw new Error("pbkdf2Sync not available");
  });

export const createCipheriv =
  cryptoModule?.createCipheriv ||
  (() => {
    throw new Error("createCipheriv not available");
  });

export const createDecipheriv =
  cryptoModule?.createDecipheriv ||
  (() => {
    throw new Error("createDecipheriv not available");
  });
