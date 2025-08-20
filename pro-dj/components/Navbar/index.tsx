"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { useEffect, useState } from "react";
import ProDJLogo from "@/components/ProDJLogo";
import { hasAdminPrivileges, getEffectiveRole } from "@/lib/auth-utils";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user profile data including profile image and display name
  useEffect(() => {
    if (session?.user?.email && status === "authenticated") {
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

            // Set display name (prioritize stage name for DJs)
            const user = data.data;
            if (user.role === "DJ" && user.djProfile?.stageName) {
              setDisplayName(user.djProfile.stageName);
            } else if (user.role === "ADMIN" && user.djProfile?.stageName) {
              setDisplayName(user.djProfile.stageName);
            } else {
              setDisplayName(user.name || user.email.split("@")[0] || "");
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    } else {
      // Clear local state when session is cleared or not authenticated
      setProfileImage(null);
      setDisplayName("");
    }
  }, [session?.user?.email, status]);

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

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
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
            </div>
            {/* Right side - Loading state */}
            <div className="flex items-center space-x-3">
              <div className="bg-gray-700 animate-pulse rounded-lg px-4 py-2 w-32 h-10"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const effectiveRole = session?.user
    ? getEffectiveRole(session.user)
    : "GUEST";
  const showDashboard =
    session?.user &&
    (effectiveRole === "DJ" ||
      effectiveRole === "ADMIN" ||
      effectiveRole === "CLIENT");

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
              href="/feed"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Feed
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

            {/* Social Media - Commented out until proper API integration
            <Link
              href="/social-media"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Social Media
            </Link>
            */}
          </div>

          {/* Right side - Auth & Actions */}
          <div className="flex items-center space-x-3">
            {status === "loading" ? (
              <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
            ) : !session?.user ? (
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
                      {displayName || session.user.name || session.user.email}
                    </div>
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(
                      effectiveRole
                    )} font-medium group-hover:scale-105 transition-transform`}
                  >
                    {effectiveRole}
                  </div>
                </Link>

                {/* Role-specific actions could be added here in the future */}

                {/* Hamburger Menu */}
                <HamburgerMenu />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
