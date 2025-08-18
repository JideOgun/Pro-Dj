"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Youtube,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLoading } from "./LoadingProvider";

interface VideoDetails {
  title: string;
  description: string;
  youtubeUrl: string;
  eventType: string;
  isFeatured: boolean;
}

interface YouTubeVideoInfo {
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
}

export default function YouTubeVideoUpload() {
  const { data: session } = useSession();
  const { showLoading, hideLoading } = useLoading();
  const [isOpen, setIsOpen] = useState(false);
  const [videoDetails, setVideoDetails] = useState<VideoDetails>({
    title: "",
    description: "",
    youtubeUrl: "",
    eventType: "",
    isFeatured: false,
  });
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const eventTypes = [
    "Wedding",
    "Birthday",
    "Corporate",
    "Club",
    "Festival",
    "Private Party",
    "Other",
  ];

  const handleInputChange = (
    field: keyof VideoDetails,
    value: string | boolean
  ) => {
    setVideoDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const extractYouTubeInfo = async (url: string) => {
    if (!url) return;

    // Extract YouTube video ID
    const youtubeIdMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );

    if (!youtubeIdMatch) {
      toast.error("Invalid YouTube URL");
      return;
    }

    const youtubeId = youtubeIdMatch[1];
    setIsExtracting(true);

    try {
      // For now, we'll use a simple approach to extract basic info
      // In a real implementation, you'd use YouTube Data API
      const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

      // Mock video info (in real app, fetch from YouTube API)
      const mockVideoInfo: YouTubeVideoInfo = {
        title: "YouTube Video", // Would be fetched from API
        description: "Video description from YouTube", // Would be fetched from API
        thumbnailUrl,
        duration: "PT3M45S", // Would be fetched from API
        viewCount: 0, // Would be fetched from API
        likeCount: 0, // Would be fetched from API
      };

      setVideoInfo(mockVideoInfo);

      // Auto-fill title and description if they're empty
      if (!videoDetails.title) {
        setVideoDetails((prev) => ({ ...prev, title: mockVideoInfo.title }));
      }
      if (!videoDetails.description) {
        setVideoDetails((prev) => ({
          ...prev,
          description: mockVideoInfo.description,
        }));
      }

      toast.success("Video information extracted successfully!");
    } catch (error) {
      console.error("Error extracting video info:", error);
      toast.error("Failed to extract video information");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("Please sign in to upload videos");
      return;
    }

    if (!videoDetails.title || !videoDetails.youtubeUrl) {
      toast.error("Title and YouTube URL are required");
      return;
    }

    showLoading("Uploading video...");

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(videoDetails),
      });

      const data = await response.json();

      if (data.ok) {
        toast.success("Video uploaded successfully!");
        setIsOpen(false);
        setVideoDetails({
          title: "",
          description: "",
          youtubeUrl: "",
          eventType: "",
          isFeatured: false,
        });
        setVideoInfo(null);
        // Trigger a page refresh or update the videos list
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to upload video");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      hideLoading();
    }
  };

  if (
    !session?.user ||
    (session.user.role !== "DJ" && session.user.role !== "ADMIN")
  ) {
    return null;
  }

  return (
    <>
      {/* Upload Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Youtube className="w-5 h-5" />
        <span>Add YouTube Video</span>
      </motion.button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <Youtube className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Add YouTube Video
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  YouTube URL *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={videoDetails.youtubeUrl}
                    onChange={(e) =>
                      handleInputChange("youtubeUrl", e.target.value)
                    }
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => extractYouTubeInfo(videoDetails.youtubeUrl)}
                    disabled={isExtracting || !videoDetails.youtubeUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>
                      {isExtracting ? "Extracting..." : "Extract Info"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Video Preview */}
              {videoInfo && (
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex space-x-4">
                    <img
                      src={videoInfo.thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-24 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">
                        {videoInfo.title}
                      </h4>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {videoInfo.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{videoInfo.viewCount} views</span>
                        <span>{videoInfo.likeCount} likes</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Video Title *
                </label>
                <input
                  type="text"
                  value={videoDetails.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter video title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={videoDetails.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Describe your video..."
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Type
                </label>
                <select
                  value={videoDetails.eventType}
                  onChange={(e) =>
                    handleInputChange("eventType", e.target.value)
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select event type (optional)</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={videoDetails.isFeatured}
                  onChange={(e) =>
                    handleInputChange("isFeatured", e.target.checked)
                  }
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <label htmlFor="featured" className="text-sm text-gray-300">
                  Mark as featured video
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Video</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
