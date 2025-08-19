// Social Media page temporarily disabled until proper API integration
// "use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Globe,
  Music,
  Video,
  Heart,
  MessageCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface InstagramPost {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  likes: number;
  comments: number;
  timestamp: string;
  permalink: string;
  dj: {
    stageName: string;
    profileImage: string | null;
  };
}

// export default function SocialMediaPage() {
  const { data: session } = useSession();
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "instagram" | "tiktok" | "facebook"
  >("instagram");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [instagramHandle, setInstagramHandle] = useState<string>("");
  const [feedType, setFeedType] = useState<"personal" | "all">("personal");

  const platforms = [
    {
      key: "instagram",
      label: "Instagram",
      icon: Instagram,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
    {
      key: "tiktok",
      label: "TikTok",
      icon: Video,
      color: "bg-black",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: Facebook,
      color: "bg-blue-600",
    },
  ];

  const fetchInstagramContent = async (page = 1) => {
    if (!session?.user?.email) return;

    setLoading(true);
    try {
      const url =
        feedType === "personal"
          ? `/api/social/instagram?djId=${session.user.email}&limit=${pagination.limit}&page=${page}`
          : `/api/social/instagram?limit=${pagination.limit}&page=${page}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setInstagramPosts(data.posts || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
        setInstagramHandle(data.instagramHandle || "");
      } else {
        const errorData = await response.json();
        console.log("Instagram API error:", errorData.error);
        if (
          !errorData.error.includes("not connected") &&
          !errorData.error.includes("not set up")
        ) {
          toast.error("Failed to load Instagram content");
        }
        setInstagramPosts([]);
        setPagination({
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (error) {
      console.error("Error fetching Instagram content:", error);
      toast.error("Failed to load Instagram content");
      setInstagramPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPlatform === "instagram") {
      fetchInstagramContent();
    }
  }, [selectedPlatform, session?.user?.email, feedType]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const renderInstagramContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-700 rounded-lg overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-600"></div>
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full mr-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-600 rounded w-full"></div>
                  <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                </div>
                <div className="flex justify-between mt-3">
                  <div className="h-3 bg-gray-600 rounded w-12"></div>
                  <div className="h-3 bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (instagramPosts.length === 0) {
      return (
        <div className="text-center py-12">
          <Instagram className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-400 mb-2 text-lg">
            No Instagram posts found
          </div>
          <p className="text-gray-500 mb-6">
            Connect your Instagram account in your profile settings to see your
            posts here.
          </p>

          {/* Instagram Setup Guide */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6 max-w-md mx-auto">
            <div className="flex items-start">
              <Instagram className="w-6 h-6 text-pink-500 mr-3 mt-1" />
              <div>
                <h4 className="text-lg font-semibold mb-2">
                  Connect Your Instagram
                </h4>
                <p className="text-gray-300 mb-4">
                  Share your Instagram posts with your audience. Add your
                  Instagram handle in your profile settings to get started.
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• Make sure your Instagram account is public</p>
                  <p>• Use your Instagram username (without @)</p>
                  <p>• Your latest posts will appear here automatically</p>
                </div>
                <a
                  href="/dashboard/profile"
                  className="inline-flex items-center mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
                >
                  Go to Profile Settings
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {instagramPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => window.open(post.permalink, "_blank")}
            >
              <div className="relative aspect-square group">
                <img
                  src={post.mediaUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {post.mediaType === "video" && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    VIDEO
                  </div>
                )}

                {/* Engagement Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1 text-red-400" />
                        {formatNumber(post.likes)}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1 text-blue-400" />
                        {formatNumber(post.comments)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {/* DJ Info */}
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-white">
                      {post.dj.stageName.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {post.dj.stageName}
                  </span>
                </div>

                <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                  {post.caption.split("#")[0]}
                </p>
                {post.caption.includes("#") && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        const hashtags = post.caption.match(/#\w+/g) || [];
                        return (
                          <>
                            {hashtags.slice(0, 3).map((hashtag, index) => (
                              <span
                                key={index}
                                className="text-xs text-violet-400 bg-violet-400/10 px-2 py-1 rounded"
                              >
                                {hashtag}
                              </span>
                            ))}
                            {hashtags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{hashtags.length - 3} more
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      {formatNumber(post.likes)}
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {formatNumber(post.comments)}
                    </div>
                  </div>
                  <span>{formatDate(post.timestamp)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center mt-8 space-x-2">
            <button
              onClick={() => fetchInstagramContent(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => fetchInstagramContent(pageNum)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    pageNum === pagination.page
                      ? "bg-violet-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchInstagramContent(pagination.page + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Media</h1>
          <p className="text-gray-400">
            Connect and share your content across platforms
          </p>
        </div>

        {/* Platform Tabs */}
        <div className="flex space-x-2 mb-8">
          {platforms.map((platform) => (
            <button
              key={platform.key}
              onClick={() => setSelectedPlatform(platform.key as any)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                selectedPlatform === platform.key
                  ? `${platform.color} text-white`
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <platform.icon className="w-4 h-4 mr-2" />
              {platform.label}
            </button>
          ))}
        </div>

        {/* Instagram Content */}
        {selectedPlatform === "instagram" && (
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Instagram className="w-6 h-6 mr-2 text-pink-500" />
                <h2 className="text-xl font-semibold">Instagram Feed</h2>
                {instagramHandle && feedType === "personal" && (
                  <span className="ml-3 text-sm text-gray-400">
                    @{instagramHandle}
                  </span>
                )}
                {feedType === "all" && (
                  <span className="ml-3 text-sm text-gray-400">All DJs</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {/* Feed Type Toggle */}
                <div className="flex bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setFeedType("personal")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      feedType === "personal"
                        ? "bg-violet-600 text-white"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    My Feed
                  </button>
                  <button
                    onClick={() => setFeedType("all")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      feedType === "all"
                        ? "bg-violet-600 text-white"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    All DJs
                  </button>
                </div>

                <button
                  onClick={() => fetchInstagramContent(1)}
                  disabled={loading}
                  className="text-sm text-gray-400 hover:text-violet-400 flex items-center transition-colors disabled:opacity-50"
                  title="Refresh Instagram content"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Refresh
                </button>
              </div>
            </div>

            {renderInstagramContent()}
          </div>
        )}

        {/* TikTok Content (Placeholder) */}
        {selectedPlatform === "tiktok" && (
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center mb-6">
              <Video className="w-6 h-6 mr-2 text-black" />
              <h2 className="text-xl font-semibold">TikTok Feed</h2>
            </div>
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 mb-2 text-lg">
                TikTok integration coming soon
              </div>
              <p className="text-gray-500">
                We're working on TikTok integration. Stay tuned!
              </p>
            </div>
          </div>
        )}

        {/* Facebook Content (Placeholder) */}
        {selectedPlatform === "facebook" && (
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center mb-6">
              <Facebook className="w-6 h-6 mr-2 text-blue-600" />
              <h2 className="text-xl font-semibold">Facebook Feed</h2>
            </div>
            <div className="text-center py-12">
              <Facebook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 mb-2 text-lg">
                Facebook integration coming soon
              </div>
              <p className="text-gray-500">
                We're working on Facebook integration. Stay tuned!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Placeholder component for when social media is disabled
export default function SocialMediaPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Social Media</h1>
          <p className="text-gray-400 mb-6">
            Social media integration is temporarily disabled during development.
          </p>
          <p className="text-gray-500">
            This feature will be available once proper API integrations are implemented.
          </p>
        </div>
      </div>
    </div>
  );
}
