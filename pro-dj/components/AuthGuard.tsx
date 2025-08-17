"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        "/auth?callbackUrl=" + encodeURIComponent(window.location.pathname)
      );
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Don't render if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  // Render children if authenticated
  return <>{children}</>;
}

