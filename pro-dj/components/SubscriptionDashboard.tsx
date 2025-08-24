"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
// Using regular HTML elements with Tailwind CSS instead of UI components
import {
  Loader2,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface Subscription {
  id: string;
  planType: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amountCents: number;
  currency: string;
  isInTrial: boolean;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  usage?: Array<{
    bookingsCount: number;
    revenueGenerated: number;
    platformFeesCollected: number;
  }>;
}

export default function SubscriptionDashboard() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscription();
    }
  }, [session?.user?.id]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else if (response.status === 404) {
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchSubscription();
    toast.success("Subscription status refreshed!");
  };

  const handleCreateSubscription = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "DJ_BASIC" }),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);

        if (data.url) {
          console.log("Redirecting to:", data.url);
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          console.error("No URL in response");
          toast.error("Failed to create checkout session");
        }
      } else {
        const error = await response.json();
        console.error("API error:", error);
        toast.error(error.error || "Failed to create subscription");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error("Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll lose access to booking features at the end of your current period."
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User requested cancellation" }),
      });

      if (response.ok) {
        toast.success(
          "Subscription will be cancelled at the end of your current period"
        );
        await fetchSubscription();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string, isInTrial: boolean) => {
    if (isInTrial) {
      return (
        <span className="px-2 py-1 bg-gray-600 text-gray-200 text-xs font-medium rounded-full">
          Trial
        </span>
      );
    }

    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
            Active
          </span>
        );
      case "PAST_DUE":
        return (
          <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
            Past Due
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-1 bg-gray-600 text-gray-200 text-xs font-medium rounded-full">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-500 text-gray-200 text-xs font-medium rounded-full border border-gray-400">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (cents: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Admin users don't need subscription
  if (session?.user?.role === "ADMIN") {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Admin Access
            </div>
            <button
              onClick={handleRefresh}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Refresh subscription status"
            >
              <RefreshCw className="h-4 w-4 text-gray-400" />
            </button>
          </h2>
        </div>
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-300">
                  Full Platform Access
                </h3>
                <p className="text-green-200 mt-1">
                  As an admin, you have access to all features without requiring
                  a subscription.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Required
            </div>
            <button
              onClick={handleRefresh}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Refresh subscription status"
            >
              <RefreshCw className="h-4 w-4 text-gray-400" />
            </button>
          </h2>
        </div>
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-300">
                  Start Your DJ Journey
                </h3>
                <p className="text-blue-200 mt-1">
                  Subscribe to start accepting bookings and growing your
                  business.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-white">
              DJ Basic Plan - $5/month
            </h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Upload unlimited mixes (200MB each)</li>
              <li>• Share event photos & portfolio</li>
              <li>• Add YouTube videos & social links</li>
              <li>• Professional DJ profile</li>
              <li>• Accept booking requests</li>
              <li>• First month FREE</li>
            </ul>
          </div>

          <button
            onClick={handleCreateSubscription}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Start Free Trial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-xl p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Details
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Refresh subscription status"
              >
                <RefreshCw className="h-4 w-4 text-gray-400" />
              </button>
              {getStatusBadge(subscription.status, subscription.isInTrial)}
            </div>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-300">Plan</h4>
            <p className="text-gray-400">DJ Basic</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-300">Price</h4>
            <p className="text-gray-400">
              {formatCurrency(subscription.amountCents, subscription.currency)}
              /month
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-300">Current Period</h4>
            <p className="text-gray-400">
              {formatDate(subscription.currentPeriodStart)} -{" "}
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-300">Next Payment</h4>
            <p className="text-gray-400">
              {subscription.isInTrial && subscription.trialEnd
                ? formatDate(subscription.trialEnd)
                : formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <p className="text-yellow-200">
                Your subscription will be cancelled at the end of the current
                period.
              </p>
            </div>
          </div>
        )}
      </div>

      {subscription.usage && subscription.usage[0] && (
        <div className="bg-gray-800/50 rounded-xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              This Month's Activity
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-300">Bookings</h4>
              <p className="text-2xl font-bold text-blue-400">
                {subscription.usage[0].bookingsCount}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Revenue Generated</h4>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(subscription.usage[0].revenueGenerated)}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300">Platform Fees</h4>
              <p className="text-2xl font-bold text-gray-400">
                {formatCurrency(subscription.usage[0].platformFeesCollected)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-xl p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">
            Subscription Actions
          </h2>
        </div>
        <div className="space-y-3">
          {!subscription.cancelAtPeriodEnd ? (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </button>
          ) : (
            <button
              className="w-full bg-gray-700 text-gray-400 font-medium py-2 px-4 rounded-lg cursor-not-allowed"
              disabled
            >
              Subscription Cancelled
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
