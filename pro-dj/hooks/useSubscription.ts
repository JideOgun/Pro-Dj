import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription?: any;
  isInTrial: boolean;
  trialDaysRemaining?: number;
  canAccessFeature: boolean;
  freeUploadsRemaining: number;
  message?: string;
  loading: boolean;
}

export function useSubscription() {
  const { data: session, status } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>({
      hasActiveSubscription: false,
      canAccessFeature: false,
      loading: true,
      isInTrial: false,
      freeUploadsRemaining: 0,
    });

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (status === "loading") {
        return;
      }

      if (!session?.user?.id) {
        setSubscriptionStatus({
          hasActiveSubscription: false,
          canAccessFeature: false,
          loading: false,
          isInTrial: false,
          freeUploadsRemaining: 0,
        });
        return;
      }

      // Only fetch if we don't already have data or if loading
      if (
        !subscriptionStatus.loading &&
        subscriptionStatus.hasActiveSubscription !== undefined
      ) {
        return;
      }

      try {
        const response = await fetch("/api/subscriptions/status");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus({
            ...data,
            loading: false,
          });
        } else {
          setSubscriptionStatus({
            hasActiveSubscription: false,
            canAccessFeature: false,
            loading: false,
            isInTrial: false,
            freeUploadsRemaining: 0,
            message: "Failed to load subscription status",
          });
        }
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        setSubscriptionStatus({
          hasActiveSubscription: false,
          canAccessFeature: false,
          loading: false,
          isInTrial: false,
          freeUploadsRemaining: 0,
          message: "Error loading subscription status",
        });
      }
    }

    fetchSubscriptionStatus();
  }, [session?.user?.id, status]);

  const canAccessFeature = (feature?: string) => {
    if (subscriptionStatus.loading) {
      return false; // Don't allow access while loading
    }

    // Check if user is admin - admins have access to all features
    if (session?.user?.role === "ADMIN") {
      return true;
    }

    if (!subscriptionStatus.canAccessFeature) {
      return false;
    }

    // Add feature-specific checks if needed
    if (feature) {
      const restrictedFeatures = [
        "bookings",
        "media_uploads",
        "mixes",
        "videos",
        "photos",
        "advanced_profile",
      ];
      if (restrictedFeatures.includes(feature)) {
        return subscriptionStatus.canAccessFeature;
      }
    }

    return true;
  };

  const refreshSubscriptionStatus = async () => {
    if (!session?.user?.id) return;

    // Prevent multiple simultaneous calls
    if (subscriptionStatus.loading) return;

    try {
      setSubscriptionStatus((prev) => ({ ...prev, loading: true }));
      const response = await fetch("/api/subscriptions/status");
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus({
          ...data,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
      setSubscriptionStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  return {
    ...subscriptionStatus,
    canAccessFeature,
    refreshSubscriptionStatus,
  };
}
