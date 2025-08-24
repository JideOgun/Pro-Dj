"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, Headphones } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <Headphones className="w-24 h-24 mx-auto text-red-500 mb-4" />
          <h1 className="text-4xl font-bold text-red-500 mb-4">Oops!</h1>
          <h2 className="text-2xl font-semibold mb-4">Something went wrong</h2>
          <p className="text-gray-400 mb-8">
            We're experiencing some technical difficulties. Please try again or
            contact support if the problem persists.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-600 text-gray-300 font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Error ID: {error.digest || "unknown"}</p>
          <p className="mt-2">Need help? Contact us at support@prodj.com</p>
        </div>
      </div>
    </div>
  );
}
