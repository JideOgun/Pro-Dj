"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AuthGuard from "@/components/AuthGuard";
import {
  Calendar,
  MapPin,
  Video,
  Users,
  ArrowRight,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Upload,
  Plus,
  Play,
  Tag,
  Star,
  Edit,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Music,
  Award,
  Heart,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import YouTubeVideoUpload from "@/components/YouTubeVideoUpload";
import LoadingSpinner from "@/components/LoadingSpinner";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  thumbnailUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  eventType: string | null;
  venue: string | null;
  location: string | null;
  isFeatured: boolean;
  createdAt: Date;
  djId: string;
  dj: {
    id: string;
    stageName: string;
    userProfileImage: string | null;
    userId: string;
    user: {
      profileImage: string | null;
    };
  };
}

interface DJ {
  djId: string;
  stageName: string;
  userProfileImage: string | null;
  userId: string;
  videos: YouTubeVideo[];
}

export default function VideosPage() {
  const { data: session } = useSession();
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Sliding gallery state
  const [currentSlide, setCurrentSlide] = useState<{ [djId: string]: number }>(
    {}
  );
  const scrollContainerRefs = useRef<{ [djId: string]: HTMLDivElement | null }>(
    {}
  );

  // Upload functionality
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/videos");
      const data = await response.json();

      if (data.ok) {
        // Group videos by DJ
        const djsMap = new Map<string, DJ>();

        data.videos.forEach((video: YouTubeVideo) => {
          const djId = video.djId;
          const dj = video.dj;

          if (!djsMap.has(djId)) {
            djsMap.set(djId, {
              djId,
              stageName: dj.stageName,
              userProfileImage: dj.user.profileImage,
              userId: dj.userId,
              videos: [],
            });
          }

          djsMap.get(djId)!.videos.push(video);
        });

        setDjs(Array.from(djsMap.values()));
      } else {
        setError(data.error || "Failed to fetch videos");
      }
    } catch (err) {
      setError("Failed to fetch videos");
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      setDeletingVideo(videoId);
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.ok) {
        toast.success("Video deleted successfully");
        await fetchVideos();
      } else {
        toast.error(data.error || "Failed to delete video");
      }
    } catch (err) {
      toast.error("Failed to delete video");
      console.error("Error deleting video:", err);
    } finally {
      setDeletingVideo(null);
      setShowDeleteModal(null);
    }
  };

  const canDeleteVideo = (video: YouTubeVideo) => {
    if (!session?.user) return false;
    if (session.user.role === "ADMIN") return true;
    return video.dj.userId === session.user.id;
  };

  const canUpload = () => {
    return session?.user?.role === "DJ" || session?.user?.role === "ADMIN";
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Date not specified";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getEventTypeColor = (eventType: string | null) => {
    switch (eventType?.toLowerCase()) {
      case "wedding":
        return "bg-pink-500/20 text-pink-300 border-pink-500/30";
      case "club":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "birthday":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "corporate":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "party":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  // Sliding gallery functions
  const scrollToEvent = (djId: string, direction: "left" | "right") => {
    const container = scrollContainerRefs.current[djId];
    if (!container) return;

    const scrollAmount = 300 + 24; // card width + gap
    const currentScroll = container.scrollLeft;

    if (direction === "left") {
      container.scrollTo({
        left: currentScroll - scrollAmount,
        behavior: "smooth",
      });
    } else {
      container.scrollTo({
        left: currentScroll + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const canScrollLeft = (djId: string) => {
    const container = scrollContainerRefs.current[djId];
    return container ? container.scrollLeft > 0 : false;
  };

  const canScrollRight = (djId: string) => {
    const container = scrollContainerRefs.current[djId];
    if (!container) return false;
    return container.scrollLeft < container.scrollWidth - container.clientWidth;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <LoadingSpinner message="Loading videos..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchVideos}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-violet-900/20 to-black">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                YouTube Videos
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Watch amazing DJ performances and behind-the-scenes content from
                our talented artists
              </p>

              {/* Upload Button */}
              {canUpload() && (
                <div className="mt-8">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Video
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Videos Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {djs.length === 0 ? (
            <div className="text-center py-16">
              <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No Videos Yet
              </h3>
              <p className="text-gray-500 mb-6">
                {canUpload()
                  ? "Start by uploading some YouTube videos to showcase your work."
                  : "No videos have been uploaded yet. Check back soon for amazing DJ performances!"}
              </p>
              {canUpload() && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Video
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {djs.map((dj) => (
                <div
                  key={dj.djId}
                  className="bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800"
                >
                  {/* DJ Header */}
                  <div className="p-3 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                      {/* DJ Profile Picture */}
                      {dj.userProfileImage ? (
                        <div className="relative w-10 h-10">
                          <Image
                            src={dj.userProfileImage}
                            alt={dj.stageName}
                            fill
                            className="rounded-full object-cover border-2 border-violet-500/30"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center border-2 border-violet-500/30">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                      )}

                      {/* DJ Information */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h2 className="text-lg font-bold text-white">
                            {dj.stageName}
                          </h2>
                          <div className="flex items-center space-x-1 text-violet-400">
                            <Award className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              Professional DJ
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-gray-400 text-xs">
                          <div className="flex items-center space-x-1">
                            <Video className="w-3 h-3" />
                            <span>
                              {dj.videos.length}{" "}
                              {dj.videos.length === 1 ? "Video" : "Videos"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>
                              {dj.videos
                                .reduce(
                                  (total, video) => total + video.viewCount,
                                  0
                                )
                                .toLocaleString()}{" "}
                              Views
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>
                              {dj.videos.filter((v) => v.isFeatured).length}{" "}
                              Featured
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Profile Button */}
                      <Link
                        href={`/dj/profile/${dj.djId}`}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg transition-colors inline-flex items-center text-xs font-medium"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Profile
                      </Link>
                    </div>
                  </div>

                  {/* Videos Sliding Gallery */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Recent Videos
                      </h3>
                    </div>

                    {/* Scrollable Videos Container with End Arrows */}
                    <div className="relative group">
                      {/* Left Arrow - Positioned at start */}
                      <button
                        onClick={() => scrollToEvent(dj.djId, "left")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/80 hover:bg-black/90 backdrop-blur-sm text-white shadow-lg transition-all duration-300 hover:scale-110"
                        style={{ opacity: canScrollLeft(dj.djId) ? 1 : 0.3 }}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      {/* Right Arrow - Positioned at end */}
                      <button
                        onClick={() => scrollToEvent(dj.djId, "right")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/80 hover:bg-black/90 backdrop-blur-sm text-white shadow-lg transition-all duration-300 hover:scale-110"
                        style={{ opacity: canScrollRight(dj.djId) ? 1 : 0.3 }}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      <div
                        ref={(el) =>
                          (scrollContainerRefs.current[dj.djId] = el)
                        }
                        className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4 px-2"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {dj.videos.map((video) => (
                          <div
                            key={video.id}
                            className="group bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 relative flex-shrink-0"
                            style={{ width: "300px" }}
                          >
                            {/* Options Menu */}
                            {canDeleteVideo(video) && (
                              <div className="absolute top-4 right-4 z-10">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(
                                      showMenu === video.id ? null : video.id
                                    );
                                  }}
                                  className="bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full p-2 text-white transition-colors"
                                  title="More options"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu */}
                                {showMenu === video.id && (
                                  <div className="absolute right-0 top-10 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[140px]">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowMenu(null);
                                        setShowDeleteModal(video.id);
                                      }}
                                      className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors text-sm"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Video
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            <Link
                              href={`/videos/${video.id}`}
                              className="block"
                            >
                              {/* Video Thumbnail */}
                              <div className="relative aspect-video overflow-hidden">
                                <Image
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="300px"
                                />

                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-red-600 rounded-full p-3">
                                    <Play className="w-6 h-6 text-white fill-white" />
                                  </div>
                                </div>

                                {/* Duration Badge */}
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                  {formatDuration(video.duration)}
                                </div>

                                {/* Featured Badge */}
                                {video.isFeatured && (
                                  <div className="absolute top-2 left-2 bg-violet-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                                    ⭐ Featured
                                  </div>
                                )}
                              </div>

                              {/* Video Info */}
                              <div className="p-4">
                                <h3 className="text-lg font-bold mb-2 group-hover:text-violet-300 transition-colors line-clamp-2">
                                  {video.title}
                                </h3>

                                <div className="space-y-2 mb-3">
                                  {/* Event Type */}
                                  {video.eventType && (
                                    <div
                                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(
                                        video.eventType
                                      )}`}
                                    >
                                      {video.eventType}
                                    </div>
                                  )}

                                  {/* Stats */}
                                  <div className="flex items-center space-x-4 text-gray-400 text-sm">
                                    <div className="flex items-center space-x-1">
                                      <Eye className="w-4 h-4" />
                                      <span>
                                        {formatNumber(video.viewCount)}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Heart className="w-4 h-4" />
                                      <span>
                                        {formatNumber(video.likeCount)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Date */}
                                  <div className="flex items-center text-gray-400 text-sm">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {formatDate(video.createdAt)}
                                  </div>

                                  {/* Venue/Location */}
                                  {(video.venue || video.location) && (
                                    <div className="flex items-center text-gray-400 text-sm">
                                      <MapPin className="w-4 h-4 mr-2" />
                                      {video.venue && video.location
                                        ? `${video.venue}, ${video.location}`
                                        : video.venue || video.location}
                                    </div>
                                  )}
                                </div>

                                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-xl font-bold text-white">Delete Video</h3>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this video? This action cannot
                be undone.
              </p>

              <p className="text-red-400 text-sm mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                ⚠️ This action cannot be undone. The video will be permanently
                removed from the platform.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  disabled={deletingVideo === showDeleteModal}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteVideo(showDeleteModal)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  disabled={deletingVideo === showDeleteModal}
                >
                  {deletingVideo === showDeleteModal ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Video
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Upload YouTube Video
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <YouTubeVideoUpload
                onSuccess={() => {
                  setShowUploadModal(false);
                  fetchVideos();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
