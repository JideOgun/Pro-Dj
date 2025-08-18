#!/usr/bin/env node

/**
 * Memory Cleanup Script
 * Run this script periodically to help prevent memory issues
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Memory monitoring function
const logMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  console.log("Memory Usage:", {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
  });
};

// Clean up temporary files
const cleanupTempFiles = () => {
  const tempDirs = [
    path.join(process.cwd(), 'public', 'uploads', 'temp'),
    path.join(process.cwd(), '.next', 'cache'),
  ];

  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`Cleaning up: ${dir}`);
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true });
      } catch (error) {
        console.error(`Error cleaning up ${dir}:`, error.message);
      }
    }
  });
};

// Force garbage collection
const forceGC = () => {
  if (global.gc) {
    console.log("Forcing garbage collection...");
    global.gc();
    logMemoryUsage();
  } else {
    console.log("Garbage collection not available. Run with --expose-gc flag.");
  }
};

// Main cleanup function
const performCleanup = () => {
  console.log("Starting memory cleanup...");
  logMemoryUsage();
  
  cleanupTempFiles();
  forceGC();
  
  console.log("Memory cleanup completed.");
  logMemoryUsage();
};

// Run cleanup if called directly
if (require.main === module) {
  performCleanup();
}

module.exports = { performCleanup, logMemoryUsage, cleanupTempFiles, forceGC };
