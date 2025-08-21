"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Music,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  Clock,
  MapPin,
  Award,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import SocialMediaManager from "@/components/SocialMediaManager";
import Image from "next/image";
import toast from "react-hot-toast";

interface DashboardStats {
  totalMixes: number;
  totalBookings: number;
  totalEarnings: number;
  averageRating: number;
  totalPlays: number;
  upcomingEvents: number;
}

interface DJProfile {
  id: string;
  stageName: string;
  bio: string;
  userProfileImage: string | null;
  genres: string[];
  experience: string;
  location: string;
  hourlyRate: number;
  isApprovedByAdmin: boolean;
  isFeatured: boolean;
  isAcceptingBookings: boolean;
}

interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  soundcloud?: string;
  youtube?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
}

export default function DjDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalMixes: 0,
    totalBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalPlays: 0,
    upcomingEvents: 0,
  });
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch DJ stats and profile
      const statsResponse = await fetch("/api/dj/dashboard/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
        setProfile(statsData.profile);
      }

      // Fetch social links (no djId needed, uses session user)
      const socialResponse = await fetch("/api/dj/profile/social-links");
      if (socialResponse.ok) {
        const socialData = await socialResponse.json();
        setSocialLinks(socialData.socialLinks || {});
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinksUpdate = (newSocialLinks: SocialLinks) => {
    setSocialLinks(newSocialLinks);
  };

  const getDisplayName = () => {
    if (profile?.stageName) {
      return profile.stageName;
    }
    return session?.user?.name || "DJ";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Pending Approval Banner */}
        {profile && !profile.isApprovedByAdmin && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-300">
                  Pending Approval
                </h3>
                <p className="text-yellow-200 text-sm">
                  Your DJ profile is currently under review. You can upload
                  mixes and manage your profile, but you won't receive booking
                  requests until an admin approves your account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header with Profile Info */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {profile?.profileImage ? (
              <div className="relative w-16 h-16">
                <Image
                  src={profile.profileImage}
                  alt={getDisplayName()}
                  fill
                  className="rounded-full object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold">{getDisplayName()}</h1>
                {profile?.isApprovedByAdmin && (
                  <CheckCircle
                    className="w-6 h-6 text-blue-500"
                    title="Verified DJ"
                  />
                )}
                {profile?.isFeatured && (
                  <Award
                    className="w-6 h-6 text-yellow-500"
                    title="Featured DJ"
                  />
                )}
              </div>
              <p className="text-gray-400">
                Welcome back! Here's your performance overview.
              </p>
            </div>
          </div>

          {/* Profile Info Cards */}
          {profile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {profile.location && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.experience && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{profile.experience} experience</span>
                </div>
              )}
              {profile.hourlyRate && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>${profile.hourlyRate}/hour</span>
                </div>
              )}
            </div>
          )}

          {/* Booking Availability Toggle */}
          {profile && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Booking Availability
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {profile.isAcceptingBookings
                      ? "You are currently accepting new booking requests"
                      : "You are currently not accepting new booking requests"}
                  </p>
                  {/* Warning about existing bookings - only show when toggle is OFF */}
                  {stats.totalBookings > 0 && !profile.isAcceptingBookings && (
                    <div className="mt-2 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-yellow-200 text-xs">
                        <strong>Note:</strong> You still need to fulfill your
                        existing bookings regardless of this setting. This only
                        affects new booking requests.
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/dj/profile", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          isAcceptingBookings: !profile.isAcceptingBookings,
                        }),
                      });

                      if (response.ok) {
                        // Update the profile state dynamically
                        setProfile((prev) =>
                          prev
                            ? {
                                ...prev,
                                isAcceptingBookings: !prev.isAcceptingBookings,
                              }
                            : null
                        );

                        // Refresh dashboard data to ensure consistency
                        await fetchDashboardData();

                        toast.success(
                          `Booking availability ${
                            !profile.isAcceptingBookings
                              ? "enabled"
                              : "disabled"
                          }`
                        );
                      } else {
                        toast.error("Failed to update availability");
                      }
                    } catch (error) {
                      toast.error("Failed to update availability");
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profile.isAcceptingBookings ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile.isAcceptingBookings
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Genres */}
          {profile?.genres && profile.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.genres.map((genre, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-violet-600/20 text-violet-300 rounded-full text-sm border border-violet-500/30"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {profile?.bio && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Mixes</p>
                <p className="text-2xl font-bold">{stats.totalMixes}</p>
              </div>
              <Music className="w-8 h-8 text-violet-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold">
                  ${stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Rating</p>
                <p className="text-2xl font-bold">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Plays</p>
                <p className="text-2xl font-bold">
                  {stats.totalPlays.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-pink-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Upcoming Events</p>
                <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800/50 rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <a
              href="/mixes"
              className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Music className="w-6 h-6 mr-3 text-violet-500" />
              <span>Upload Mix</span>
            </a>
            <a
              href="/videos"
              className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6 mr-3 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span>Add Video</span>
            </a>
            <a
              href="/social-media"
              className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6 mr-3 text-pink-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Social Media</span>
            </a>
            <a
              href="/dashboard/bookings?view=dj"
              className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Calendar className="w-6 h-6 mr-3 text-blue-500" />
              <span>View Bookings</span>
            </a>
            <a
              href="/dashboard/earnings"
              className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <DollarSign className="w-6 h-6 mr-3 text-green-500" />
              <span>Earnings</span>
            </a>
            <a
              href="/dashboard/profile"
              className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Users className="w-6 h-6 mr-3 text-orange-500" />
              <span>Profile</span>
            </a>
            <a
              href="/dashboard/dj/pricing"
              className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <DollarSign className="w-6 h-6 mr-3 text-green-500" />
              <span>Pricing & Add-ons</span>
            </a>
          </div>
        </motion.div>

        {/* Social Media Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <SocialMediaManager
            djId={session?.user?.id || ""}
            initialSocialLinks={socialLinks}
            onUpdate={handleSocialLinksUpdate}
          />
        </motion.div>
      </div>
    </div>
  );
}
