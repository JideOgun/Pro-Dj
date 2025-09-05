"use client";

import { useState } from "react";
import {
  Check,
  X,
  CreditCard,
  Shield,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface StripeConnectSetupProps {
  isOpen: boolean;
  onComplete: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function StripeConnectSetup({
  isOpen,
  onComplete,
  onCancel,
  isLoading = false,
}: StripeConnectSetupProps) {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const handleCreateConnectAccount = async () => {
    setIsCreatingAccount(true);
    try {
      const response = await fetch("/api/stripe/connect/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();

        // Redirect to Stripe Connect onboarding
        if (data.accountLink) {
          window.location.href = data.accountLink;
        } else {
          toast.error("Failed to get Stripe Connect link");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create Stripe Connect account");
      }
    } catch (error) {
      console.error("Stripe Connect error:", error);
      toast.error("Failed to create Stripe Connect account");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Stripe Connect Setup
              </h2>
              <p className="text-gray-400 text-sm">
                Set up your payment account to receive payouts
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading || isCreatingAccount}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-300 font-medium mb-2">
                  Ready to Receive Payments?
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  To receive payments from bookings, you need to set up a Stripe
                  Connect account. This secure process takes just a few minutes
                  and allows you to receive direct payouts to your bank account.
                </p>
              </div>
            </div>
          </div>

          {/* What You'll Need */}
          <div className="bg-gray-700/30 rounded-lg border border-gray-600/30 p-4">
            <h3 className="text-lg font-medium text-white mb-3">
              What You'll Need
            </h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Government-issued ID (Driver's License or Passport)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Bank account information for payouts</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Social Security Number (already provided)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Business information (if applicable)</span>
              </li>
            </ul>
          </div>

          {/* Process Steps */}
          <div className="bg-gray-700/30 rounded-lg border border-gray-600/30 p-4">
            <h3 className="text-lg font-medium text-white mb-3">
              Setup Process
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="text-gray-300 text-sm">
                    <strong>Click "Start Setup"</strong> - We'll create your
                    Stripe Connect account
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="text-gray-300 text-sm">
                    <strong>Complete Verification</strong> - Provide your ID and
                    bank details
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="text-gray-300 text-sm">
                    <strong>Start Earning</strong> - You'll receive payouts
                    directly to your bank account
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-green-300 font-medium mb-2">
                  Secure & Trusted
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Stripe is a trusted payment processor used by millions of
                  businesses worldwide. Your information is encrypted and
                  secure. Pro-DJ never stores your banking details.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-yellow-300 font-medium mb-2">
                  Important Notes
                </h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>
                    • You must complete this setup to receive payments from
                    bookings
                  </li>
                  <li>• The process typically takes 5-10 minutes</li>
                  <li>
                    • You can save your progress and return later if needed
                  </li>
                  <li>• Contact support if you encounter any issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={onCancel}
            disabled={isLoading || isCreatingAccount}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateConnectAccount}
            disabled={isLoading || isCreatingAccount}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isCreatingAccount ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Start Setup
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
