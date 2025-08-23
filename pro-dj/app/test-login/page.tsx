"use client";
import { useState } from "react";

export default function TestLoginPage() {
  const [email, setEmail] = useState("jideogun93@gmail.com");
  const [password, setPassword] = useState("Dickens3114");
  const [result, setResult] = useState("");

  const handleLogin = async () => {
    try {
      setResult("Testing credentials directly...");

      // Test the credentials directly through our API
      const response = await fetch("/api/test-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      setResult(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Exception: ${error}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Test Login</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Test Credentials
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Debug Output:
          </h3>
          <pre className="text-sm whitespace-pre-wrap text-blue-900 bg-white p-3 rounded border">
            {result}
          </pre>
        </div>
      </div>
    </div>
  );
}
