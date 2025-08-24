"use client";

import { useSession } from "next-auth/react";

export default function DebugSessionPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Session Debug</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Session Status</h2>
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Authenticated:</strong> {session ? "Yes" : "No"}
          </p>
        </div>

        {session && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">User Info</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(session.user, null, 2)}
            </pre>
          </div>
        )}

        {session?.user && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Role Check</h2>
            <p>
              <strong>User Role:</strong> {session.user.role}
            </p>
            <p>
              <strong>Is Admin:</strong>{" "}
              {session.user.role === "ADMIN" ? "Yes" : "No"}
            </p>
            <p>
              <strong>User ID:</strong> {session.user.id}
            </p>
            <p>
              <strong>Email:</strong> {session.user.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
