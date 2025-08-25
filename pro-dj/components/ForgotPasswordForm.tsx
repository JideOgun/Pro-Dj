"use client";

import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setSubmitted(true);
      } else {
        toast.error(data.error || "Failed to send reset email");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Check Your Email
        </h2>
        <p className="text-gray-300 mb-4">
          If an account with {email} exists, we've sent a password reset link to your email.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setEmail("");
          }}
          className="text-violet-400 hover:text-violet-300 flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="w-5 h-5 text-violet-400" />
        <h2 className="text-xl font-semibold text-white">Forgot Password</h2>
      </div>

      <p className="text-gray-300 mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Enter your email address"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
