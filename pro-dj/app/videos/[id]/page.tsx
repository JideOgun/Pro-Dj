"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import CommentSection from "@/components/CommentSection";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Heart,
  MapPin,
  Tag,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string | null;
  duration: string | null;
  eventType: string | null;
  eventDate: string | null;
  venue: string | null;
  location: string | null;
  tags: string[];
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  dj: {
    id: string;
    stageName: string;
    userProfileImage: string | null;
    user: {
      id: string;
      name: string;
    };
  };
}

export default function VideoDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const videoId = params.id as string;

  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}`);
      const data = await response.json();

      if (data.ok) {
        setVideo(data.video);
      } else {
        toast.error("Video not found");
      }
    } catch (error) {
      console.error("Failed to fetch video:", error);
      toast.error("Failed to load video");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-4">Video not found</div>
          <Link
            href="/videos"
            className="text-violet-400 hover:text-violet-300"
          >
            Back to Videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/videos"
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Videos
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
                {video.description && (
                  <p className="text-gray-300 mb-4">{video.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {video.dj.stageName}
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {video.viewCount} views
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {video.likeCount} likes
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(video.createdAt)}
                  </div>
                </div>
              </div>

              {/* YouTube Embed */}
              <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=0&rel=0`}
                  title={video.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Video Info */}
              <div className="mt-6 space-y-4">
                {video.eventType && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400 mr-2">Event Type:</span>
                    <span className="bg-violet-600 text-white px-2 py-1 rounded text-xs">
                      {video.eventType}
                    </span>
                  </div>
                )}

                {video.eventDate && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    Event Date: {formatEventDate(video.eventDate)}
                  </div>
                )}

                {video.venue && (
                  <div className="flex items-center text-sm text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    Venue: {video.venue}
                  </div>
                )}

                {video.location && (
                  <div className="flex items-center text-sm text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location: {video.location}
                  </div>
                )}

                {video.tags.length > 0 && (
                  <div className="flex items-start text-sm">
                    <Tag className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Comments</h2>
              <CommentSection commentType="video" itemId={video.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-xl p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">About this Video</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">DJ</div>
                  <div className="flex items-center">
                    {video.dj.userProfileImage ? (
                      <img
                        src={video.dj.userProfileImage}
                        alt={video.dj.stageName}
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs text-gray-300 font-medium">
                          {video.dj.stageName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium">{video.dj.stageName}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Duration</div>
                  <div className="font-medium">
                    {video.duration || "Unknown"}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Uploaded</div>
                  <div className="font-medium">
                    {formatDate(video.createdAt)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Views</div>
                  <div className="font-medium">
                    {video.viewCount.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Likes</div>
                  <div className="font-medium">
                    {video.likeCount.toLocaleString()}
                  </div>
                </div>

                {video.eventType && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Event Type</div>
                    <div className="font-medium">{video.eventType}</div>
                  </div>
                )}

                {video.isFeatured && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <div className="font-medium text-violet-400">Featured</div>
                  </div>
                )}
              </div>

              {/* Watch on YouTube Button */}
              <div className="mt-6">
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
