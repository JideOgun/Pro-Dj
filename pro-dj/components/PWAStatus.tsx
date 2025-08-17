"use client";

import { useState, useEffect } from "react";
import { Smartphone, Wifi, WifiOff, Download } from "lucide-react";

export default function PWAStatus() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (installed)
    const checkStandalone = () => {
      const standalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      setIsStandalone(standalone);
      setShowStatus(standalone);
    };

    // Check online status
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    checkStandalone();
    checkOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkStandalone);

    return () => {
      window.removeEventListener("online", checkOnlineStatus);
      window.removeEventListener("offline", checkOnlineStatus);
      mediaQuery.removeEventListener("change", checkStandalone);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center space-x-2">
      {/* Standalone indicator */}
      {isStandalone && (
        <div className="bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg">
          <Smartphone className="w-3 h-3" />
          <span>App</span>
        </div>
      )}

      {/* Online/Offline indicator */}
      <div
        className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg ${
          isOnline ? "bg-blue-600 text-white" : "bg-red-600 text-white"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Install prompt for non-standalone */}
      {!isStandalone && (
        <div className="bg-violet-600 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg cursor-pointer hover:bg-violet-700 transition-colors">
          <Download className="w-3 h-3" />
          <span>Install</span>
        </div>
      )}
    </div>
  );
}
