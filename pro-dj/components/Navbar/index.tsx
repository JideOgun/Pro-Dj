"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Music, User } from "lucide-react";
import { useEffect, useState } from "react";
import ProDJLogo from "@/components/ProDJLogo";

export default function Navbar() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "GUEST";
  const showDashboard = role === "DJ" || role === "ADMIN" || role === "CLIENT";
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch user profile data including profile image
  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.data) {
            // Check both profileImage field and userMedia
            const profileImageUrl =
              data.data.profileImage ||
              (data.data.userMedia && data.data.userMedia.length > 0
                ? data.data.userMedia[0].url
                : null);

            if (profileImageUrl) {
              setProfileImage(profileImageUrl);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    }
  }, [session?.user?.email]);

  // Listen for profile updates (when user uploads new profile picture)
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (session?.user?.email) {
        fetch("/api/profile")
          .then((res) => res.json())
          .then((data) => {
            if (data.ok && data.data) {
              // Check both profileImage field and userMedia
              const profileImageUrl =
                data.data.profileImage ||
                (data.data.userMedia && data.data.userMedia.length > 0
                  ? data.data.userMedia[0].url
                  : null);

              if (profileImageUrl) {
                setProfileImage(profileImageUrl);
              }
            }
          })
          .catch((error) => {
            console.error("Error fetching profile:", error);
          });
      }
    };

    // Listen for custom event when profile is updated
    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [session?.user?.email]);

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
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <ProDJLogo variant="transparent" size="2xl" format="png" />
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

            <Link
              href="/mixes"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Mixes
            </Link>

            <Link
              href="/videos"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              YouTube Sets
            </Link>

            <Link
              href="/gallery"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Gallery
            </Link>

            <Link
              href="/social-media"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Social Media
            </Link>
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
                {/* User info with profile photo and role badge - clickable to profile */}
                <Link
                  href="/dashboard/profile"
                  className="flex items-center space-x-3 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-200 cursor-pointer group"
                >
                  {/* Profile Photo */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 border-2 border-violet-500/30 shadow-lg">
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {/* Online status indicator */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-white font-medium truncate max-w-32 group-hover:text-violet-300 transition-colors">
                      {session.user.name || session.user.email}
                    </div>
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(
                      role
                    )} font-medium group-hover:scale-105 transition-transform`}
                  >
                    {role}
                  </div>
                </Link>

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
