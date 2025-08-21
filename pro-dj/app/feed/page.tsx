"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Repeat, User, Calendar, Clock, Heart, ArrowRight } from "lucide-react";
import WaveformPlayer from "@/components/WaveformPlayer";
import RepostButton from "@/components/RepostButton";
import FollowButton from "@/components/FollowButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import Link from "next/link";

interface FeedItem {
  type: "repost" | "new_mix";
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    profileImage: string | null;
  };
  mix: {
    id: string;
    title: string;
    duration: number;
    cloudFrontUrl: string | null;
    localUrl: string;
    albumArtUrl: string | null;
    dj: {
      id: string;
      stageName: string;
      userId: string;
      user?: {
        profileImage: string | null;
      };
    };
  };
}

interface LikedMix {
  id: string;
  title: string;
  duration: number;
  cloudFrontUrl: string | null;
  localUrl: string;
  albumArtUrl: string | null;
  dj: {
    id: string;
    stageName: string;
    userId: string;
    user?: {
      profileImage: string | null;
    };
  };
  likedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function FeedPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [likedMixes, setLikedMixes] = useState<LikedMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedMixesLoading, setLikedMixesLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session?.user) {
      fetchFeed();
      fetchLikedMixes();
      fetchFollowingUsers();
    }
  }, [session?.user, page]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feed?page=${page}&limit=10`);
      const data = await response.json();

      if (data.ok) {
        if (page === 1) {
          setFeed(data.feed);
        } else {
          setFeed((prev) => [...prev, ...data.feed]);
        }
        setPagination(data.pagination);
      } else {
        toast.error("Failed to load feed");
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedMixes = async () => {
    try {
      setLikedMixesLoading(true);
      const response = await fetch("/api/mixes/liked");
      const data = await response.json();

      if (data.ok) {
        setLikedMixes(data.mixes);
      }
    } catch (error) {
      console.error("Error fetching liked mixes:", error);
    } finally {
      setLikedMixesLoading(false);
    }
  };

  const fetchFollowingUsers = async () => {
    try {
      const response = await fetch("/api/follow/following");
      const data = await response.json();

      if (data.ok) {
        const followingIds = data.following.map(
          (follow: any) => follow.followingId
        );
        setFollowingUsers(new Set(followingIds));
      }
    } catch (error) {
      console.error("Error fetching following users:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatMixDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Sign in to view your feed
          </h1>
          <p className="text-gray-400 mb-6">
            Follow DJs and see their latest activity
          </p>
          <button
            onClick={() => router.push("/api/auth/signin")}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Loading your feed..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Feed</h1>
          <p className="text-gray-400">
            Latest activity from DJs and users you follow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {/* Main Feed */}
          <div className="md:col-span-2 lg:col-span-3 space-y-4">
            {feed.length === 0 && !loading ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">
                  Your feed is empty
                </div>
                <p className="text-gray-500 mb-6">
                  Start following DJs to see their latest mixes and activity
                </p>
                <button
                  onClick={() => router.push("/mixes")}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
                >
                  Discover Mixes
                </button>
              </div>
            ) : (
              feed.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                >
                  {/* Activity Header - Compact */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {item.user.profileImage ? (
                        <img
                          src={item.user.profileImage}
                          alt={item.user.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-300 font-medium">
                            {item.user.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-white font-medium text-sm">
                          {item.user.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {item.type === "repost" ? (
                            <>
                              <Repeat className="w-3 h-3" />
                              <span>reposted</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3" />
                              <span>uploaded a new mix</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto">
                      {!followingUsers.has(item.user.id) && (
                        <FollowButton userId={item.user.id} size="sm" />
                      )}
                    </div>
                  </div>

                  {/* Mix Card - Using same structure as main mixes page */}
                  <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600/50">
                    {/* Mix Header - Clickable for navigation */}
                    <div
                      className="flex items-center justify-between mb-3 cursor-pointer"
                      onClick={() => router.push(`/mixes/${item.mix.id}`)}
                    >
                      <h3 className="text-lg font-semibold text-white truncate flex-1">
                        {item.mix.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <RepostButton
                          mixId={item.mix.id}
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Audio Player - Non-clickable, controls only */}
                    <div
                      className="audio-player-container mb-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative w-full">
                        <WaveformPlayer
                          src={item.mix.cloudFrontUrl || item.mix.localUrl}
                          title={item.mix.title}
                          artist={item.mix.dj.stageName}
                          duration={item.mix.duration}
                          albumArtUrl={item.mix.albumArtUrl}
                          mixId={item.mix.id}
                          djUserId={item.mix.dj.userId}
                          showLikeButton={true}
                          showRepostButton={true}
                          className="w-full max-w-full"
                        />
                      </div>
                    </div>

                    {/* Mix Info - Clickable for navigation */}
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between text-sm text-gray-400 space-y-2 xs:space-y-0">
                      <div
                        className="flex items-center space-x-2 sm:space-x-3 flex-wrap cursor-pointer"
                        onClick={() => router.push(`/mixes/${item.mix.id}`)}
                      >
                        <div className="flex items-center space-x-2">
                          {item.mix.dj.user?.profileImage ? (
                            <img
                              src={item.mix.dj.user.profileImage}
                              alt={item.mix.dj.stageName}
                              className="w-4 h-4 rounded-full flex-shrink-0 object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-gray-300 font-medium">
                                {item.mix.dj.stageName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span className="text-violet-400 font-medium text-sm truncate">
                            {item.mix.dj.stageName}
                          </span>
                        </div>
                        <div className="hidden sm:block text-gray-500">•</div>
                        <div className="bg-gray-800/50 px-2 py-1 rounded text-xs font-mono flex-shrink-0">
                          {formatDuration(item.mix.duration)}
                        </div>
                        <div className="hidden sm:block text-gray-500">•</div>
                        <div className="text-xs flex-shrink-0">
                          {formatMixDate(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {/* Load More */}
            {pagination?.hasNextPage && (
              <div className="text-center pt-6">
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loading}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Liked Mixes using SuggestedMixes structure */}
          <div className="md:col-span-1 lg:col-span-2 min-w-0">
            <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Liked Mixes
                </h3>
                <Link
                  href="/mixes?filter=liked"
                  className="flex items-center text-violet-400 hover:text-violet-300 transition-colors text-sm"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {likedMixesLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner message="Loading liked mixes..." />
                </div>
              ) : likedMixes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm mb-2">
                    No liked mixes yet
                  </div>
                  <p className="text-gray-500 text-xs mb-4">
                    Like some mixes to see them here
                  </p>
                  <button
                    onClick={() => router.push("/mixes")}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Discover Mixes
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {likedMixes.slice(0, 3).map((mix, index) => (
                    <motion.div
                      key={mix.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-700/50 rounded-lg p-2 sm:p-3 border border-gray-600/50 hover:bg-gray-700/70 transition-colors"
                    >
                      {/* Mix Header - Clickable for navigation */}
                      <div
                        className="flex items-center justify-between mb-2 cursor-pointer"
                        onClick={() => router.push(`/mixes/${mix.id}`)}
                      >
                        <h4 className="font-medium text-white truncate flex-1 pr-2">
                          {mix.title}
                        </h4>
                      </div>

                      {/* Audio Player - Non-clickable, controls only */}
                      <div
                        className="audio-player-container mb-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative w-full">
                          <WaveformPlayer
                            src={mix.cloudFrontUrl || mix.localUrl}
                            title={mix.title}
                            artist={mix.dj.stageName}
                            duration={mix.duration}
                            albumArtUrl={mix.albumArtUrl}
                            mixId={mix.id}
                            showLikeButton={true}
                            showRepostButton={true}
                            className="w-full max-w-full"
                            compact={true}
                          />
                        </div>
                      </div>

                      {/* Mix Info - Clickable for navigation */}
                      <div
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400 space-y-2 sm:space-y-0 cursor-pointer"
                        onClick={() => router.push(`/mixes/${mix.id}`)}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                          <div className="flex items-center space-x-2">
                            {mix.dj.user?.profileImage ? (
                              <img
                                src={mix.dj.user.profileImage}
                                alt={mix.dj.stageName}
                                className="w-4 h-4 rounded-full flex-shrink-0"
                              />
                            ) : (
                              <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-gray-300 font-medium">
                                  {mix.dj.stageName.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="text-violet-400 font-medium text-sm truncate">
                              {mix.dj.stageName}
                            </span>
                          </div>
                          <div className="hidden sm:block text-gray-500">•</div>
                          <div className="bg-gray-800/50 px-2 py-1 rounded text-xs font-mono flex-shrink-0">
                            {formatDuration(mix.duration)}
                          </div>
                          <div className="hidden sm:block text-gray-500">•</div>
                          <div className="text-xs flex-shrink-0">
                            {formatDate(mix.likedAt)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
