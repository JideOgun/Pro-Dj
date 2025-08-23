"use client";

import { useState } from "react";
import { X, Crown, Calendar, Star, Zap, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSubscription } from "@/hooks/useSubscription";
import toast from "react-hot-toast";

interface GallerySubscriptionPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GallerySubscriptionPrompt({
  isOpen,
  onClose,
}: GallerySubscriptionPromptProps) {
  const { data: session } = useSession();
  const { refreshSubscriptionStatus } = useSubscription();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    if (!session?.user) {
      toast.error("Please sign in to subscribe");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: "DJ_BASIC",
          redirectTo: "gallery",
        }),
      });

      const data = await response.json();

      if (data.ok && data.url) {
        // Refresh subscription status before redirecting
        await refreshSubscriptionStatus();
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create subscription");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error("Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Unlock Unlimited Events
          </h2>
          <p className="text-gray-400">
            Create unlimited event galleries and showcase your work
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-green-400" />
            </div>
            <span className="text-gray-300">Unlimited event galleries</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-green-400" />
            </div>
            <span className="text-gray-300">Unlimited photos per event</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-green-400" />
            </div>
            <span className="text-gray-300">Priority support</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-green-400" />
            </div>
            <span className="text-gray-300">Advanced analytics</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-3xl font-bold text-white">$5</span>
              <span className="text-gray-400">/month</span>
            </div>
            <p className="text-sm text-gray-400">
              Start with a 30-day free trial
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Free Trial
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition-colors"
          >
            Maybe Later
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Cancel anytime. No commitment required.
        </p>
      </div>
    </div>
  );
}
