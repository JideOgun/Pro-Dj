"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";

interface SuspendedUserGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SuspendedUserGuard({
  children,
  fallback,
}: SuspendedUserGuardProps) {
  const { data: session } = useSession();

  // If user is suspended, show fallback or nothing
  if (session?.user?.status === "SUSPENDED") {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
