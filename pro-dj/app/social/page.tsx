"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Instagram,
  Heart,
  MessageCircle,
  User,
  Calendar,
  Filter,
  ExternalLink,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
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
    userProfileImage: string | null;
  };
}

export default function SocialPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    djId: "",
  });

  useEffect(() => {
    fetchInstagramContent();
  }, [currentPage, filters]);

  const fetchInstagramContent = async () => {
    try {
      setLoading(true);

      // Fetch Instagram content from all DJs
      const instagramResponse = await fetch(
        `/api/social/instagram?limit=12&page=${currentPage}`
      );

      if (instagramResponse.ok) {
        const data = await instagramResponse.json();
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      } else {
        console.error("Failed to fetch Instagram content");
        toast.error("Failed to load Instagram content");
      }
    } catch (error) {
      console.error("Failed to fetch Instagram content:", error);
      toast.error("Failed to load Instagram content");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Loading Instagram content..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Instagram className="w-8 h-8 text-pink-500 mr-3" />
              <h1 className="text-4xl font-bold">Instagram Feed</h1>
            </div>
            <p className="text-gray-300 text-lg">
              Latest posts from our amazing DJs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">
                Instagram Feed
              </span>
            </div>

            <div className="text-sm text-gray-400">
              {totalItems} posts from {posts.length > 0 ? posts.length : 0} DJs
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800/70 transition-colors cursor-pointer group"
              onClick={() => window.open(post.permalink, "_blank")}
            >
              {/* Instagram Badge */}
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <Instagram className="w-3 h-3 mr-1" />
                  Instagram
                </div>
              </div>

              {/* Media */}
              <div className="relative aspect-square">
                <img
                  src={post.mediaUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
                {post.mediaType === "video" && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    VIDEO
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* DJ Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {post.dj.userProfileImage ? (
                      <img
                        src={post.dj.userProfileImage}
                        alt={post.dj.stageName}
                        className="w-6 h-6 rounded-full mr-2 object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs text-gray-300 font-medium">
                          {post.dj.stageName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-300">
                      {post.dj.stageName}
                    </span>
                  </div>
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Caption */}
                <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                  {post.caption}
                </p>

                {/* Stats */}
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
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(post.timestamp)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={12}
          onPageChange={handlePageChange}
          className="mt-8"
        />

        {/* Empty State */}
        {posts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Instagram className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">
              No Instagram posts found
            </div>
            <p className="text-gray-500">
              DJs haven't connected their Instagram accounts yet. Check back
              later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
