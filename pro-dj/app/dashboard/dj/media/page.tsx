"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Music,
  Video,
  Instagram,
  Youtube,
  Image,
  Plus,
  ExternalLink,
  Play,
  Heart,
  MessageCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface MediaStats {
  totalMixes: number;
  totalVideos: number;
  totalPhotos: number;
  totalViews: number;
  totalLikes: number;
}

interface RecentMedia {
  id: string;
  type: "mix" | "video" | "photo" | "social";
  title: string;
  thumbnail?: string;
  url?: string;
  createdAt: string;
  views?: number;
  likes?: number;
  comments?: number;
}

const MediaDashboard: React.FC = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<MediaStats>({
    totalMixes: 0,
    totalVideos: 0,
    totalPhotos: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  const [recentMedia, setRecentMedia] = useState<RecentMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchMediaStats();
      fetchRecentMedia();
    }
  }, [session]);

  const fetchMediaStats = async () => {
    try {
      // This would fetch aggregated stats from your API
      // For now, using placeholder data
      setStats({
        totalMixes: 12,
        totalVideos: 8,
        totalPhotos: 24,
        totalViews: 15420,
        totalLikes: 892,
      });
    } catch (error) {
      console.error("Error fetching media stats:", error);
      toast.error("Failed to load media statistics");
    }
  };

  const fetchRecentMedia = async () => {
    try {
      // This would fetch recent media from your API
      // For now, using placeholder data
      setRecentMedia([
        {
          id: "1",
          type: "mix",
          title: "Afrobeats Summer Mix 2024",
          thumbnail: "/api/placeholder/300/200",
          url: "/mixes/1",
          createdAt: "2024-01-15T10:30:00Z",
          views: 1250,
          likes: 89,
          comments: 12,
        },
        {
          id: "2",
          type: "video",
          title: "Live Performance at Club XYZ",
          thumbnail: "/api/placeholder/300/200",
          url: "https://youtube.com/watch?v=abc123",
          createdAt: "2024-01-14T15:45:00Z",
          views: 3200,
          likes: 156,
          comments: 8,
        },
        {
          id: "3",
          type: "photo",
          title: "Wedding Reception Set",
          thumbnail: "/api/placeholder/300/200",
          url: "/portfolio/3",
          createdAt: "2024-01-13T20:15:00Z",
          views: 890,
          likes: 45,
          comments: 3,
        },
      ]);
    } catch (error) {
      console.error("Error fetching recent media:", error);
      toast.error("Failed to load recent media");
    } finally {
      setIsLoading(false);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "mix":
        return <Music className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "photo":
        return <Image className="w-5 h-5" />;
      case "social":
        return <Instagram className="w-5 h-5" />;
      default:
        return <Music className="w-5 h-5" />;
    }
  };

  const getMediaTypeColor = (type: string) => {
    switch (type) {
      case "mix":
        return "bg-violet-500";
      case "video":
        return "bg-red-500";
      case "photo":
        return "bg-blue-500";
      case "social":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Media Dashboard
          </h1>
          <p className="text-gray-600">
            Manage and showcase all your media content in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Mixes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.totalMixes)}
                </p>
              </div>
              <div className="bg-violet-100 p-3 rounded-lg">
                <Music className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Videos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.totalVideos)}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Video className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.totalViews)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Likes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.totalLikes)}
                </p>
              </div>
              <div className="bg-pink-100 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/dashboard/dj/mixes"
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-violet-100 p-2 rounded-lg">
                <Music className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Mixes</p>
                <p className="text-sm text-gray-600">Upload & organize</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/dj/videos"
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Youtube className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">YouTube Videos</p>
                <p className="text-sm text-gray-600">Add & showcase</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/dj/social"
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-pink-100 p-2 rounded-lg">
                <Instagram className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Social Media</p>
                <p className="text-sm text-gray-600">Connect accounts</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/dj/portfolio"
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Portfolio</p>
                <p className="text-sm text-gray-600">Event photos</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Media */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Media
            </h2>
            <Link
              href="/dashboard/dj/media/all"
              className="text-violet-600 hover:text-violet-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentMedia.map((media, index) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                    <div
                      className={`p-2 rounded-lg ${getMediaTypeColor(
                        media.type
                      )}`}
                    >
                      {getMediaIcon(media.type)}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getMediaTypeColor(
                        media.type
                      )}`}
                    >
                      {media.type}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {media.title}
                  </h3>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>{formatDate(media.createdAt)}</span>
                    <div className="flex items-center space-x-3">
                      {media.views && (
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{formatNumber(media.views)}</span>
                        </div>
                      )}
                      {media.likes && (
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{formatNumber(media.likes)}</span>
                        </div>
                      )}
                      {media.comments && (
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{formatNumber(media.comments)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {media.type === "video" ? (
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-red-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        <Youtube className="w-4 h-4 inline mr-1" />
                        Watch
                      </a>
                    ) : (
                      <Link
                        href={media.url || "#"}
                        className="flex-1 bg-violet-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                      >
                        <Play className="w-4 h-4 inline mr-1" />
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaDashboard;
