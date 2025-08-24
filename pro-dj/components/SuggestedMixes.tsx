"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import WaveformPlayer from "./WaveformPlayer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSocketContext } from "./SocketProvider";

// Global audio manager to prevent multiple mixes playing simultaneously
let globalAudioManager: {
  currentMixId: string | null;
  stopOtherMixes: (mixId: string) => void;
} = {
  currentMixId: null,
  stopOtherMixes: () => {},
};

// Initialize global audio manager
if (typeof window !== "undefined") {
  globalAudioManager = {
    currentMixId: null,
    stopOtherMixes: (mixId: string) => {
      // Stop all other audio elements
      const audioElements = document.querySelectorAll("audio");
      audioElements.forEach((audio) => {
        if (audio.getAttribute("data-mix-id") !== mixId) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    },
  };
}

interface DjMix {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  cloudFrontUrl: string | null;
  localUrl: string;
  albumArtUrl: string | null;
  createdAt: string;
  playCount: number;
  downloadCount: number;
  dj: {
    id: string;
    stageName: string;
    userId: string;
    profileImage: string | null;
  };
  userLiked: boolean;
  likeCount: number;
}

interface SuggestedMixesProps {
  currentMixId?: string; // Exclude current mix from suggestions
  className?: string;
}

export default function SuggestedMixes({
  currentMixId,
  className = "",
}: SuggestedMixesProps) {
  const [suggestedMixes, setSuggestedMixes] = useState<DjMix[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocketContext();

  useEffect(() => {
    fetchSuggestedMixes();
  }, [currentMixId]);

  // Listen for real-time mix like updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMixLikeUpdate = (data: {
      mixId: string;
      userId: string;
      liked: boolean;
      likeCount: number;
    }) => {
      // Update the mix in our local state
      setSuggestedMixes((prevMixes) =>
        prevMixes.map((mix) =>
          mix.id === data.mixId ? { ...mix, likeCount: data.likeCount } : mix
        )
      );
    };

    socket.on("mix-like-updated", handleMixLikeUpdate);

    return () => {
      socket.off("mix-like-updated", handleMixLikeUpdate);
    };
  }, [socket, isConnected]);

  const fetchSuggestedMixes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mixes?limit=3");
      const data = await response.json();

      if (data.ok) {
        // Filter out the current mix if provided
        const filteredMixes = currentMixId
          ? data.mixes.filter((mix: DjMix) => mix.id !== currentMixId)
          : data.mixes;

        setSuggestedMixes(filteredMixes.slice(0, 3)); // Show max 3 suggestions
      }
    } catch (error) {
      console.error("Error fetching suggested mixes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className={`bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 ${className}`}
      >
        <h3 className="text-lg font-semibold mb-4">Suggested Mixes</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestedMixes.length === 0) {
    return (
      <div
        className={`bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 ${className}`}
      >
        <h3 className="text-lg font-semibold mb-4">Suggested Mixes</h3>
        <p className="text-gray-400 text-center py-8">
          No other mixes available
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Suggested Mixes</h3>
        <Link
          href="/mixes"
          className="flex items-center text-violet-400 hover:text-violet-300 transition-colors text-sm"
        >
          View All
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-4">
        {suggestedMixes.map((mix, index) => (
          <motion.div
            key={mix.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600/50 hover:bg-gray-700/70 transition-colors"
          >
            {/* Mix Header - Clickable for navigation */}
            <div
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => (window.location.href = `/mixes/${mix.id}`)}
            >
              <h4 className="font-medium text-white truncate flex-1 pr-2">
                {mix.title}
              </h4>
            </div>

            {/* Audio Player - Non-clickable, controls only */}
            <div
              className="audio-player-container mb-3 overflow-hidden"
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
                  djUserId={mix.dj.userId}
                  initialLiked={mix.userLiked || false}
                  initialLikeCount={mix.likeCount || 0}
                  showLikeButton={false}
                  showRepostButton={false}
                  mini={true}
                  className="w-full max-w-full"
                  onPlayStart={() => globalAudioManager.stopOtherMixes(mix.id)}
                />
              </div>
            </div>

            {/* Mix Info - Clickable for navigation */}
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400 space-y-2 sm:space-y-0 cursor-pointer"
              onClick={() => (window.location.href = `/mixes/${mix.id}`)}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <div className="flex items-center space-x-2">
                  {/* DJ Profile Photo */}
                  {mix.dj.userProfileImage ? (
                    <img
                      src={mix.dj.userProfileImage}
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
                  {formatDate(mix.createdAt)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
