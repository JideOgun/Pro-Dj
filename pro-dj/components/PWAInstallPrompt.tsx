"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import ProDJLogo from "@/components/ProDJLogo";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      // User accepted the install prompt
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store in localStorage to remember user dismissed it
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if already installed or user dismissed it
  if (
    isInstalled ||
    !showInstallPrompt ||
    localStorage.getItem("pwa-install-dismissed")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg shadow-lg border border-violet-500/30">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <ProDJLogo size="lg" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                Install Pro-DJ
              </h3>
              <p className="text-white/80 text-xs">
                Get the app for a better experience
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="bg-white text-violet-600 hover:bg-white/90 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
