"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function DebugRemoveSubscription() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const removeSubscription = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/debug-cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to remove subscription");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
          <p>Please log in first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Cancel Subscription (Debug)
        </h1>

        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h2 className="font-semibold mb-2">Current User:</h2>
          <p>
            <strong>Email:</strong> {session.user.email}
          </p>
          <p>
            <strong>Name:</strong> {session.user.name}
          </p>
          <p>
            <strong>Role:</strong> {session.user.role}
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={removeSubscription}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? "Cancelling..." : "Cancel Subscription"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <h3 className="font-semibold text-red-400 mb-2">Error:</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="mb-4 p-4 bg-green-900/50 border border-green-700 rounded-lg">
            <h3 className="font-semibold text-green-400 mb-2">Success!</h3>
            <p className="text-green-300 mb-2">{result.message}</p>
            <div className="text-sm text-green-300">
              <p>
                <strong>Cancelled Subscription:</strong>
              </p>
              <p>ID: {result.cancelledSubscription.id}</p>
              <p>Status: {result.cancelledSubscription.status}</p>
              <p>Plan: {result.cancelledSubscription.planType}</p>
              <p>
                Cancelled At:{" "}
                {new Date(
                  result.cancelledSubscription.cancelledAt
                ).toLocaleString()}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-green-700">
              <p>
                <strong>User Reset:</strong>
              </p>
              <p>Free Uploads Used: {result.user.freeUploadsUsed}</p>
              <p>Max Free Uploads: {result.user.maxFreeUploads}</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <a
            href="/mixes"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Go to Mixes Page to Test
          </a>
        </div>
      </div>
    </div>
  );
}
