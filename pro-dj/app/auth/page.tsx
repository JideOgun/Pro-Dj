"use client";
import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Chrome, Music } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    if (isLogin) {
      // Handle login
      const res = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
    } else {
      // Handle registration
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success("Account created successfully!");
          // Auto-login after registration
          const loginRes = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (loginRes?.error) {
            setError(
              "Account created but login failed. Please try logging in."
            );
            setIsLoading(false);
            return;
          }

          router.push(callbackUrl);
        } else {
          setError(data.error || "Registration failed");
          setIsLoading(false);
        }
      } catch (error) {
        setError("Something went wrong");
        setIsLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Music className="w-16 h-16 mb-4 mx-auto" />
            <h1 className="text-2xl font-bold mb-2">
              {isLogin ? "Welcome Back" : "Join Pro-DJ"}
            </h1>
            <p className="text-gray-300">
              {isLogin
                ? "Sign in to your Pro-DJ account"
                : "Create your account to start booking DJs"}
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-600 text-gray-900 font-medium py-3 px-6 rounded-lg transition-colors mb-6 flex items-center justify-center"
          >
            <Chrome className="w-5 h-5 mr-2" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">
                or use email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="••••••••"
                  required={!isLogin}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {/* Toggle between login/register */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  resetForm();
                }}
                className="text-violet-400 hover:text-violet-300 font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Info for new users */}
          {!isLogin && (
            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-violet-400 mb-2">
                What happens next?
              </h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• You&apos;ll start as a client and can book DJs</li>
                <li>• Browse DJs by location, genre, and price</li>
                <li>• Later, you can upgrade to become a DJ</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
