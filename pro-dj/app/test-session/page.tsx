"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

export default function TestSessionPage() {
  const { data: session, status } = useSession();
  const [apiResult, setApiResult] = useState<any>(null);

  const testApiSession = async () => {
    try {
      const response = await fetch("/api/test-session", {
        credentials: "include",
      });
      const data = await response.json();
      setApiResult(data);
    } catch (error) {
      setApiResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Session Test</h1>

        <div className="space-y-6">
          {/* Frontend Session */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              Frontend Session (useSession)
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Status:</strong> {status}
              </p>
              <p>
                <strong>Has Session:</strong> {session ? "Yes" : "No"}
              </p>
              {session && (
                <div className="bg-gray-700 p-4 rounded">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* API Session Test */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Session Test</h2>
            <button
              onClick={testApiSession}
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg transition-colors"
            >
              Test API Session
            </button>
            {apiResult && (
              <div className="mt-4 bg-gray-700 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

