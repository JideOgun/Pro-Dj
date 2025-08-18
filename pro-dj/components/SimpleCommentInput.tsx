"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Send, User } from "lucide-react";
import toast from "react-hot-toast";

interface SimpleCommentInputProps {
  commentType: "mix" | "video" | "post" | "photo";
  itemId: string;
  className?: string;
}

export default function SimpleCommentInput({
  commentType,
  itemId,
  className = "",
}: SimpleCommentInputProps) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    profileImage: string | null;
  } | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.id) return;

      setIsLoadingProfile(true);
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.data) {
            setUserProfile(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [session?.user?.id]);

  const handleSubmit = async () => {
    if (!session?.user) {
      toast.error("Please log in to comment");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: comment.trim(),
          commentType,
          itemId,
        }),
      });

      if (response.ok) {
        setComment("");
        toast.success("Comment posted successfully!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div
      className={`bg-gray-800/50 rounded-lg pt-2 pr-2 pb-2 pl-0 border border-gray-700/50 ${className}`}
    >
      <div className="flex items-center space-x-2 pl-2">
        <div className="flex-shrink-0">
          {isLoadingProfile ? (
            <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-2 h-2 text-gray-300" />
            </div>
          ) : userProfile?.profileImage ? (
            <img
              src={userProfile.profileImage}
              alt={userProfile.name || "User"}
              className="w-4 h-4 rounded-full"
            />
          ) : session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-4 h-4 rounded-full"
            />
          ) : (
            <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-2 h-2 text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center space-x-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 p-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
            placeholder="Write a comment..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
            className="px-2 py-1.5 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-1 transition-colors text-xs"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
