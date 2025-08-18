"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useSocketContext } from "./SocketProvider";

interface LikeButtonProps {
  mixId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showCount?: boolean;
}

export default function LikeButton({
  mixId,
  initialLiked,
  initialLikeCount,
  size = "md",
  className = "",
  showCount = true,
}: LikeButtonProps) {
  const { data: session } = useSession();
  const { socket, isConnected, emitMixLiked } = useSocketContext();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Listen for real-time like updates from other users
  useEffect(() => {
    console.log("🔍 LikeButton Debug:", {
      socket: !!socket,
      isConnected,
      mixId,
      userId: session?.user?.id,
    });

    if (!socket || !isConnected) {
      console.log("❌ Socket not connected or not available");
      return;
    }

    const handleMixLikeUpdate = (data: {
      mixId: string;
      userId: string;
      liked: boolean;
      likeCount: number;
    }) => {
      console.log("📡 Received mix-like-updated event:", data);
      console.log("🔍 Checking if this update is for us:", {
        eventMixId: data.mixId,
        ourMixId: mixId,
        eventUserId: data.userId,
        ourUserId: session?.user?.id,
      });

      if (data.mixId === mixId && data.userId !== session?.user?.id) {
        console.log("✅ Updating like count from other user:", data.likeCount);
        // Update like count from other users' actions
        setLikeCount(data.likeCount);
      } else {
        console.log("❌ Ignoring update - not for this mix or from same user");
      }
    };

    console.log("🎧 Setting up mix-like-updated listener");
    socket.on("mix-like-updated", handleMixLikeUpdate);

    return () => {
      console.log("🧹 Cleaning up mix-like-updated listener");
      socket.off("mix-like-updated", handleMixLikeUpdate);
    };
  }, [socket, isConnected, mixId, session?.user?.id]);

  const handleLike = async () => {
    if (!session?.user) {
      toast.error("Please sign in to like mixes");
      return;
    }

    if (isLoading || isAnimating) return;

    setIsLoading(true);
    setIsAnimating(true);

    // Show particles when liking (not unliking)
    if (!liked) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 1000);
    }

    // Optimistic update for immediate feedback
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    setLiked(newLiked);
    setLikeCount(newCount);

    try {
      const response = await fetch(`/api/mixes/${mixId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);

        // Emit real-time update to other users
        if (isConnected) {
          console.log("📤 Emitting mix-liked event:", {
            mixId,
            userId: session.user.id,
            liked: data.liked,
            likeCount: data.likeCount,
          });
          emitMixLiked(mixId, session.user.id, data.liked, data.likeCount);
        } else {
          console.log("❌ Socket not connected, cannot emit mix-liked event");
        }

        if (data.liked) {
          toast.success("Mix liked!", {
            icon: "❤️",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        } else {
          toast.success("Mix unliked", {
            icon: "💔",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        }
      } else {
        // Revert optimistic update on error
        setLiked(!newLiked);
        setLikeCount(newLiked ? likeCount : likeCount + 1);
        toast.error("Failed to update like");
      }
    } catch (error) {
      // Revert optimistic update on error
      setLiked(!newLiked);
      setLikeCount(newLiked ? likeCount : likeCount + 1);
      toast.error("Failed to update like");
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Particle effect component
  const ParticleEffect = () => (
    <AnimatePresence>
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 1,
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{
                opacity: 0,
                scale: 1,
                x: (Math.random() - 0.5) * 60,
                y: (Math.random() - 0.5) * 60,
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: i * 0.1,
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-400 rounded-full"
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <motion.button
          onClick={handleLike}
          disabled={isLoading}
          whileHover={{
            scale: 1.1,
            transition: { duration: 0.2 },
          }}
          whileTap={{
            scale: 0.9,
            transition: { duration: 0.1 },
          }}
          animate={{
            scale: isAnimating ? [1, 1.3, 1] : 1,
            rotate: isAnimating ? [0, -10, 10, 0] : 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={`
            relative flex items-center justify-center rounded-full transition-all duration-200
            ${
              liked
                ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-lg shadow-red-500/25"
                : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border border-gray-600/50 hover:border-gray-500/50"
            }
            ${sizeClasses[size]}
            ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            ${isAnimating ? "ring-2 ring-red-400/50" : ""}
          `}
          title={liked ? "Unlike this mix" : "Like this mix"}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={liked ? "liked" : "unliked"}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <Heart
                className={`${iconSizes[size]} ${liked ? "fill-current" : ""}`}
              />
            </motion.div>
          </AnimatePresence>
        </motion.button>
        <ParticleEffect />
      </div>

      {showCount && (
        <motion.span
          key={likeCount}
          initial={{ scale: 1.2, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`${textSizes[size]} text-gray-400 font-medium min-w-[1.5rem] text-center`}
        >
          {likeCount}
        </motion.span>
      )}
    </div>
  );
}
