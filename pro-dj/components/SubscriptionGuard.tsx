"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionUpgradePrompt } from "./SubscriptionUpgradePrompt";

interface SubscriptionGuardProps {
  children: ReactNode;
  feature?: string;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  returnUrl?: string;
}

export function SubscriptionGuard({
  children,
  feature,
  fallback,
  showUpgradePrompt = true,
  returnUrl,
}: SubscriptionGuardProps) {
  const { canAccessFeature, loading, hasActiveSubscription } =
    useSubscription();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  const hasAccess = canAccessFeature(feature);

  if (!hasAccess) {
    if (showUpgradePrompt) {
      return (
        <SubscriptionUpgradePrompt feature={feature} returnUrl={returnUrl} />
      );
    }

    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
