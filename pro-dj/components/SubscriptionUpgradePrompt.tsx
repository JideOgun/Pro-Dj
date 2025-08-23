"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Crown, Zap, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionUpgradePromptProps {
  feature?: string;
  onClose?: () => void;
  returnUrl?: string;
}

export function SubscriptionUpgradePrompt({
  feature,
  onClose,
  returnUrl,
}: SubscriptionUpgradePromptProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshSubscriptionStatus } = useSubscription();

  const getFeatureName = (feature?: string) => {
    switch (feature) {
      case "bookings":
        return "Accept Bookings";
      case "media_uploads":
        return "Upload Media";
      case "mixes":
        return "Upload Mixes";
      case "videos":
        return "Upload Videos";
      case "photos":
        return "Upload Photos";
      case "advanced_profile":
        return "Advanced Profile Features";
      default:
        return "Premium Features";
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: "DJ_BASIC",
          returnUrl: returnUrl || "/dashboard/dj",
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.url) {
          // Refresh subscription status before redirecting
          await refreshSubscriptionStatus();
          console.log("Redirecting to:", data.url);
          window.location.href = data.url;
        } else {
          console.error("No URL in response");
        }
      } else {
        console.error("Failed to create subscription");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 text-center relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="flex justify-center mb-4">
        <div className="bg-purple-100 p-3 rounded-full">
          <Lock className="w-6 h-6 text-purple-600" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {getFeatureName(feature)} Requires Subscription
      </h3>

      <p className="text-gray-600 mb-4">
        Upgrade to our DJ Basic Plan to unlock{" "}
        {getFeatureName(feature).toLowerCase()} and all premium features.
      </p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Zap className="w-4 h-4 text-green-500" />
          <span>30-day free trial</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Crown className="w-4 h-4 text-yellow-500" />
          <span>Only $5/month after trial</span>
        </div>
      </div>

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
      >
        {loading ? "Loading..." : "Start Free Trial"}
      </button>

      <p className="text-xs text-gray-500 mt-3">
        Cancel anytime. No commitment required.
      </p>
    </div>
  );
}
