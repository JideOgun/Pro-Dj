"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function DebugSubscriptionPage() {
  const { data: session } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkSubscriptionStatus = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const response = await fetch("/api/test-subscription-status");
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTestSubscription = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const response = await fetch("/api/debug-create-subscription", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        toast.success("Test subscription created!");
        await checkSubscriptionStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create test subscription");
      }
    } catch (error) {
      console.error("Error creating test subscription:", error);
      toast.error("Failed to create test subscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      checkSubscriptionStatus();
    }
  }, [session?.user?.id]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Subscription</h1>
        <p>Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Subscription Status</h1>

      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <div className="space-y-2">
            <p>
              <strong>User ID:</strong> {session.user.id}
            </p>
            <p>
              <strong>Email:</strong> {session.user.email}
            </p>
            <p>
              <strong>Role:</strong> {session.user.role}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Subscription Status</h2>
            <button
              onClick={checkSubscriptionStatus}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {subscriptionStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Has Subscription:</strong>{" "}
                  {subscriptionStatus.hasSubscription ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  {subscriptionStatus.subscriptionStatus}
                </div>
              </div>

              {subscriptionStatus.subscription && (
                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-semibold mb-2">Subscription Details:</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(subscriptionStatus.subscription, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p>No subscription data available.</p>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Actions</h2>
          <div className="space-y-4">
            <button
              onClick={createTestSubscription}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Test Subscription"}
            </button>

            <p className="text-sm text-gray-400">
              This will create a test subscription with trial status for
              debugging purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
