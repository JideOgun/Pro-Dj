"use client";

import { useState, useEffect } from "react";
import { Download, Wifi, Zap, Shield } from "lucide-react";
import ProDJLogo from "@/components/ProDJLogo";

export default function PWAInfo() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [installInstructions, setInstallInstructions] = useState<string>("");

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Get platform-specific instructions
    const getInstallInstructions = () => {
      const userAgent = navigator.userAgent;

      if (/iPhone|iPad|iPod/.test(userAgent)) {
        return "Tap Share button → Add to Home Screen";
      } else if (/Android/.test(userAgent)) {
        return "Tap menu → Add to Home Screen";
      } else if (/Chrome/.test(userAgent)) {
        return "Click install icon (📱) in address bar";
      } else {
        return "Look for install icon in address bar";
      }
    };

    setInstallInstructions(getInstallInstructions());

    // Check if app is running in standalone mode
    const checkStandalone = () => {
      const standalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      setIsStandalone(standalone);
      // Show banner if not in standalone mode (no dismissal check)
      setShowInfo(!standalone);
    };

    checkStandalone();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkStandalone);

    return () => {
      mediaQuery.removeEventListener("change", checkStandalone);
    };
  }, []);

  if (!showInfo) return null;

  return (
    <div className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 border-b border-violet-500/30">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-violet-600 rounded-full p-1.5">
              <ProDJLogo size="sm" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Install Pro-DJ App
              </h3>
              <div className="flex items-center space-x-4 text-xs text-gray-300">
                <span>📱 Home screen</span>
                <span>⚡ Offline</span>
                <span>🔒 Secure</span>
                <span className="text-violet-400 font-medium">
                  💡 {installInstructions || "Install app"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
