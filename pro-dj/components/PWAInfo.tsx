"use client";

import { useState, useEffect } from "react";
import { Smartphone, Download, Wifi, Zap, Shield } from "lucide-react";

export default function PWAInfo() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode
    const checkStandalone = () => {
      const standalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      setIsStandalone(standalone);
      // Only show info if not in standalone mode and not dismissed
      setShowInfo(!standalone && !localStorage.getItem("pwa-info-dismissed"));
    };

    checkStandalone();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkStandalone);

    return () => {
      mediaQuery.removeEventListener("change", checkStandalone);
    };
  }, []);

  const handleDismiss = () => {
    setShowInfo(false);
    localStorage.setItem("pwa-info-dismissed", "true");
  };

  if (!showInfo) return null;

  return (
    <div className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/30 rounded-lg p-6 mb-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-violet-600 rounded-full p-2">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Install Pro-DJ App
            </h3>
          </div>

          <p className="text-gray-300 mb-4">
            Get the full Pro-DJ experience with our mobile app. Install it on
            your device for faster access and offline features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Download className="w-4 h-4 text-violet-400" />
              <span>Install on home screen</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Wifi className="w-4 h-4 text-violet-400" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Zap className="w-4 h-4 text-violet-400" />
              <span>Faster loading</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Shield className="w-4 h-4 text-violet-400" />
              <span>Secure & private</span>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            <p>
              💡 Look for the "Add to Home Screen" option in your browser menu
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white ml-4 transition-colors"
          title="Dismiss"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
