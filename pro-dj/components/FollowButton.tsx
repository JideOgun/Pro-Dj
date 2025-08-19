"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { UserPlus, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export default function FollowButton({
  userId,
  initialIsFollowing = false,
  initialFollowersCount = 0,
  className = "",
  size = "md",
  showCount = false,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isLoading, setIsLoading] = useState(false);

  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Fetch initial follow data
  useEffect(() => {
    if (session?.user && userId !== session.user.id) {
      fetchFollowData();
    }
  }, [session?.user, userId]);

  const fetchFollowData = async () => {
    try {
      const response = await fetch(`/api/follow?userId=${userId}`);
      const data = await response.json();

      if (data.ok) {
        setIsFollowing(data.data.isFollowing);
        setFollowersCount(data.data.followersCount);
      }
    } catch (error) {
      console.error("Error fetching follow data:", error);
    }
  };

  const handleFollow = async () => {
    if (!session?.user) {
      toast.error("Please sign in to follow users");
      return;
    }

    if (userId === session.user.id) {
      toast.error("Cannot follow yourself");
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/follow?userId=${userId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.ok) {
          setIsFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
          toast.success("Unfollowed user");
        } else {
          toast.error(data.error || "Failed to unfollow");
        }
      } else {
        // Follow
        const response = await fetch("/api/follow", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIdToFollow: userId }),
        });

        const data = await response.json();

        if (data.ok) {
          setIsFollowing(true);
          setFollowersCount((prev) => prev + 1);
          toast.success("User followed!");
        } else {
          toast.error(data.error || "Failed to follow");
        }
      }
    } catch (error) {
      console.error("Error handling follow:", error);
      toast.error("Failed to follow/unfollow");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show follow button for own profile
  if (session?.user?.id === userId) {
    return null;
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleFollow}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
          : "bg-violet-600 hover:bg-violet-700 text-white"
      } ${className}`}
    >
      {isFollowing ? (
        <UserCheck className={sizes[size]} />
      ) : (
        <UserPlus className={sizes[size]} />
      )}
      <span className={textSizes[size]}>
        {isFollowing ? "Following" : "Follow"}
      </span>
      {showCount && followersCount > 0 && (
        <span className={`${textSizes[size]} text-gray-400`}>
          {followersCount}
        </span>
      )}
    </motion.button>
  );
}
