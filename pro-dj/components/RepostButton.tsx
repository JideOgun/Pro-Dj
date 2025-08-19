"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Repeat, Repeat2 } from "lucide-react";
import toast from "react-hot-toast";

interface RepostButtonProps {
  mixId: string;
  initialRepostCount?: number;
  initialHasReposted?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: (e: React.MouseEvent) => void;
  djUserId?: string; // Add DJ user ID to check ownership
}

export default function RepostButton({
  mixId,
  initialRepostCount = 0,
  initialHasReposted = false,
  className = "",
  size = "md",
  onClick,
  djUserId,
}: RepostButtonProps) {
  const { data: session } = useSession();
  const [repostCount, setRepostCount] = useState(initialRepostCount);
  const [hasReposted, setHasReposted] = useState(initialHasReposted);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

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

  // Fetch initial repost data
  useEffect(() => {
    if (session?.user) {
      fetchRepostData();
    }
  }, [session?.user, mixId]);

  const fetchRepostData = async () => {
    try {
      const response = await fetch(`/api/repost?mixId=${mixId}`);
      const data = await response.json();

      if (data.ok) {
        setRepostCount(data.data.repostCount);
        setHasReposted(data.data.hasReposted);
      }
    } catch (error) {
      console.error("Error fetching repost data:", error);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    // Prevent rapid clicking (debounce)
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      // 1 second debounce
      return;
    }
    setLastClickTime(now);

    // Call the onClick prop if provided (for event handling like stopPropagation)
    if (onClick) {
      onClick(e);
    }

    if (!session?.user) {
      toast.error("Please sign in to repost");
      return;
    }

    setIsLoading(true);
    try {
      if (hasReposted) {
        // Remove repost
        const response = await fetch(`/api/repost?mixId=${mixId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.ok) {
          setHasReposted(false);
          setRepostCount((prev) => Math.max(0, prev - 1));
          toast.success("Repost removed");
        } else {
          toast.error(data.error || "Failed to remove repost");
        }
      } else {
        // Add repost
        const response = await fetch("/api/repost", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mixId }),
        });

        const data = await response.json();

        if (data.ok) {
          setHasReposted(true);
          setRepostCount((prev) => prev + 1);
          toast.success("Mix reposted!");
        } else {
          toast.error(data.error || "Failed to repost");
        }
      }
    } catch (error) {
      console.error("Error handling repost:", error);
      toast.error("Failed to repost");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show repost button if user is the owner of the mix
  if (djUserId && session?.user?.id === djUserId) {
    return null;
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleRepost}
      disabled={isLoading}
      className={`flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <motion.div
        animate={hasReposted ? { rotate: 360 } : {}}
        transition={{ duration: 0.3 }}
      >
        {hasReposted ? (
          <Repeat2 className={`${sizes[size]} text-green-400`} />
        ) : (
          <Repeat className={sizes[size]} />
        )}
      </motion.div>
      {repostCount > 0 && (
        <span className={`${textSizes[size]} font-medium`}>{repostCount}</span>
      )}
    </motion.button>
  );
}
