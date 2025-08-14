"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "GUEST";
  const showDashboard = role === "DJ" || role === "ADMIN" || role === "CLIENT";

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Brand */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl">🎵</div>
            <span className="text-xl font-bold text-white">Pro-DJ</span>
          </Link>

          {showDashboard && (
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Right side - Auth & Actions */}
        <div className="flex items-center space-x-4">
          {/* Role indicator */}
          <span className="text-sm text-gray-400 px-3 py-1 bg-gray-800 rounded-full">
            {role}
          </span>

          {/* Auth buttons */}
          {!session?.user ? (
            <Link
              href="/auth"
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In / Register
            </Link>
          ) : (
            <div className="flex items-center space-x-4">
              {/* User info */}
              <div className="text-right">
                <div className="text-sm text-white font-medium">
                  {session.user.name || session.user.email}
                </div>
                <div className="text-xs text-gray-400">{role}</div>
              </div>

              {/* Become DJ button for clients */}
              {session.user.role === "CLIENT" && (
                <Link
                  href="/dj/register"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Become a DJ
                </Link>
              )}

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
