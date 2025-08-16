"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Music } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "GUEST";
  const showDashboard = role === "DJ" || role === "ADMIN" || role === "CLIENT";

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-900/30 text-red-200 border-red-700/30";
      case "DJ":
        return "bg-blue-900/30 text-blue-200 border-blue-700/30";
      case "CLIENT":
        return "bg-green-900/30 text-green-200 border-green-700/30";
      default:
        return "bg-gray-800 text-gray-400 border-gray-700";
    }
  };

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Brand */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Music className="w-6 h-6" />
              <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Pro-DJ
              </span>
            </Link>

            {showDashboard && (
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Right side - Auth & Actions */}
          <div className="flex items-center space-x-3">
            {!session?.user ? (
              <Link
                href="/auth"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In / Register
              </Link>
            ) : (
              <div className="flex items-center space-x-3">
                {/* User info with role badge */}
                <div className="flex items-center space-x-3 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/50">
                  <div className="text-right">
                    <div className="text-sm text-white font-medium truncate max-w-32">
                      {session.user.name || session.user.email}
                    </div>
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(
                      role
                    )} font-medium`}
                  >
                    {role}
                  </div>
                </div>

                {/* Become DJ button for clients */}
                {session.user.role === "CLIENT" && (
                  <Link
                    href="/dj/register"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Become a DJ
                  </Link>
                )}

                {/* Sign out */}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
