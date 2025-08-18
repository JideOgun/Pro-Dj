"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Heart,
  ThumbsDown,
  Reply,
  Edit,
  Trash2,
  Send,
  User,
  MoreVertical,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Pagination from "./Pagination";
import { useSocketContext } from "./SocketProvider";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  likes: number;
  dislikes: number;
  userLiked?: boolean;
  userDisliked?: boolean;
  replies?: Comment[];
  isEditing?: boolean;
}

interface CommentSectionProps {
  commentType: "mix" | "video" | "photo";
  itemId: string;
  className?: string;
}

export default function CommentSection({
  commentType,
  itemId,
  className = "",
}: CommentSectionProps) {
  const { data: session } = useSession();
  const {
    socket,
    isConnected,
    emitCommentAdded,
    emitCommentUpdated,
    emitCommentLiked,
  } = useSocketContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const handleReplyTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setEditContent(e.target.value);
    adjustTextareaHeight(e.target);
  };

  // Fetch user profile
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/profile`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setUserProfile(data.profile);
          }
        })
        .catch((error) => {
          console.error("Error fetching user profile:", error);
        });
    }
  }, [session?.user?.id]);

  // Fetch comments
  const fetchComments = async (pageNum: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/comments?type=${commentType}&itemId=${itemId}&page=${pageNum}`
      );
      const data = await response.json();

      if (data.ok) {
        if (pageNum === 1) {
          setComments(data.comments);
        } else {
          setComments((prev) => [...prev, ...data.comments]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [commentType, itemId]);

  // Listen for real-time comment updates from other users
  useEffect(() => {
    if (!socket || !isConnected || commentType !== "mix") return;

    const handleCommentAdded = (data: {
      mixId: string;
      commentId: string;
      commentCount: number;
      comment: any;
    }) => {
      if (data.mixId === itemId) {
        // Add new comment to the list
        setComments((prev) => [data.comment, ...prev]);
      }
    };

    const handleCommentUpdated = (data: {
      mixId: string;
      commentId: string;
      commentCount: number;
      action: "edited" | "deleted";
      comment?: any;
    }) => {
      if (data.mixId === itemId) {
        if (data.action === "deleted") {
          // Remove deleted comment
          setComments((prev) => prev.filter((c) => c.id !== data.commentId));
        } else if (data.action === "edited" && data.comment) {
          // Update edited comment
          setComments((prev) =>
            prev.map((c) => (c.id === data.commentId ? data.comment : c))
          );
        }
      }
    };

    const handleCommentLikeUpdated = (data: {
      mixId: string;
      commentId: string;
      userId: string;
      liked: boolean;
      likeCount: number;
    }) => {
      if (data.mixId === itemId && data.userId !== session?.user?.id) {
        // Update comment like count from other users
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === data.commentId) {
              return { ...c, likes: data.likeCount };
            }
            return c;
          })
        );
      }
    };

    socket.on("comment-added", handleCommentAdded);
    socket.on("comment-updated", handleCommentUpdated);
    socket.on("comment-like-updated", handleCommentLikeUpdated);

    return () => {
      socket.off("comment-added", handleCommentAdded);
      socket.off("comment-updated", handleCommentUpdated);
      socket.off("comment-like-updated", handleCommentLikeUpdated);
    };
  }, [socket, isConnected, itemId, commentType, session?.user?.id]);

  // Submit comment
  const handleSubmitComment = async (parentId?: string) => {
    if (!session?.user) {
      toast.error("Please sign in to comment");
      return;
    }

    const content = parentId ? editContent : newComment;
    if (!content.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          commentType,
          itemId,
          parentId,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        if (parentId) {
          // Update existing comment
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === parentId
                ? { ...comment, content: content.trim(), isEditing: false }
                : comment
            )
          );
          setEditContent("");
          setEditingComment(null);

          // Emit real-time update for comment edit
          if (isConnected && commentType === "mix") {
            emitCommentUpdated(
              itemId,
              parentId,
              comments.length,
              "edited",
              data.comment
            );
          }

          toast.success("Comment updated successfully!");
        } else {
          // Add new comment
          setComments((prev) => [data.comment, ...prev]);
          setNewComment("");
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }

          // Emit real-time update for new comment
          if (isConnected && commentType === "mix") {
            emitCommentAdded(
              itemId,
              data.comment.id,
              comments.length + 1,
              data.comment
            );
          }

          toast.success("Comment posted successfully!");
        }
      } else {
        toast.error(data.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like/dislike
  const handleLike = async (commentId: string) => {
    if (!session?.user) {
      toast.error("Please sign in to like comments");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.ok) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  likes: data.liked ? comment.likes + 1 : comment.likes - 1,
                  dislikes: comment.userDisliked
                    ? comment.dislikes - 1
                    : comment.dislikes,
                  userLiked: data.liked,
                  userDisliked: false,
                }
              : comment
          )
        );

        // Emit real-time update for comment like
        if (isConnected && commentType === "mix") {
          const updatedComment = comments.find((c) => c.id === commentId);
          if (updatedComment) {
            const newLikeCount = data.liked
              ? updatedComment.likes + 1
              : updatedComment.likes - 1;
            emitCommentLiked(
              itemId,
              commentId,
              session.user.id,
              data.liked,
              newLikeCount
            );
          }
        }
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!session?.user) {
      toast.error("Please sign in to dislike comments");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/dislike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.ok) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  dislikes: data.disliked
                    ? comment.dislikes + 1
                    : comment.dislikes - 1,
                  likes: comment.userLiked ? comment.likes - 1 : comment.likes,
                  userDisliked: data.disliked,
                  userLiked: false,
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error("Error disliking comment:", error);
      toast.error("Failed to dislike comment");
    }
  };

  // Handle edit
  const handleEdit = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      setEditContent(comment.content);
      setEditingComment(commentId);
      setShowReplyInput(commentId);
    }
  };

  // Handle delete
  const handleDelete = async (commentId: string) => {
    if (!session?.user) {
      toast.error("Please sign in to delete comments");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.ok) {
        setComments((prev) =>
          prev.filter((comment) => comment.id !== commentId)
        );

        // Emit real-time update for comment deletion
        if (isConnected && commentType === "mix") {
          emitCommentUpdated(itemId, commentId, comments.length - 1, "deleted");
        }

        toast.success("Comment deleted successfully!");
      } else {
        toast.error(data.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  // Render comment
  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwner = session?.user?.id === comment.user.id;
    const isEditing = editingComment === comment.id;

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 ${
          isReply ? "ml-8 border-l-2 border-l-violet-500/30" : ""
        }`}
      >
        <div className="flex items-start space-x-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {comment.user.profileImage ? (
              <img
                src={comment.user.profileImage}
                alt={comment.user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Comment Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-white">
                  {comment.user.name}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {isOwner && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(comment.id)}
                    className="text-gray-400 hover:text-violet-400 transition-colors p-1 rounded"
                    title="Edit comment"
                  >
                    <Edit className="w-3 h-3" />
                  </motion.button>
                )}

                {isOwner && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </motion.button>
                )}

                {!isReply && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setShowReplyInput(
                        showReplyInput === comment.id ? null : comment.id
                      )
                    }
                    className="text-gray-400 hover:text-violet-400 transition-colors p-1 rounded"
                    title="Reply to comment"
                  >
                    <Reply className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Comment Content */}
            {isEditing ? (
              <div className="mb-3">
                <textarea
                  ref={replyTextareaRef}
                  value={editContent}
                  onChange={handleReplyTextareaChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg resize-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  rows={1}
                  placeholder="Edit your comment..."
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent("");
                      setShowReplyInput(null);
                    }}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubmitComment(comment.id)}
                    disabled={!editContent.trim() || isSubmitting}
                    className="px-3 py-1 bg-violet-600 text-white rounded text-sm hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </motion.button>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 mb-3">{comment.content}</p>
            )}

            {/* Reply Input */}
            <AnimatePresence>
              {showReplyInput === comment.id && !isReply && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3"
                >
                  <textarea
                    value={editContent}
                    onChange={handleReplyTextareaChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg resize-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    rows={1}
                    placeholder="Write a reply..."
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowReplyInput(null);
                        setEditContent("");
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSubmitComment(comment.id)}
                      disabled={!editContent.trim() || isSubmitting}
                      className="px-3 py-1 bg-violet-600 text-white rounded text-sm hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? "Posting..." : "Reply"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Like/Dislike Buttons */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleLike(comment.id)}
                className={`flex items-center space-x-1 text-sm transition-colors ${
                  comment.userLiked
                    ? "text-red-400"
                    : "text-gray-400 hover:text-red-400"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    comment.userLiked ? "fill-current" : ""
                  }`}
                />
                <span>{comment.likes}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDislike(comment.id)}
                className={`flex items-center space-x-1 text-sm transition-colors ${
                  comment.userDisliked
                    ? "text-blue-400"
                    : "text-gray-400 hover:text-blue-400"
                }`}
              >
                <ThumbsDown
                  className={`w-4 h-4 ${
                    comment.userDisliked ? "fill-current" : ""
                  }`}
                />
                <span>{comment.dislikes}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Render replies */}
        {(comment.replies || []).length > 0 && (
          <div className="mt-4 space-y-3">
            {(comment.replies || []).map((reply) => renderComment(reply, true))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comment input */}
      {session?.user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {userProfile?.profileImage ? (
                <img
                  src={userProfile.profileImage}
                  alt={userProfile.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              ) : session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleTextareaChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg resize-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                rows={1}
                placeholder="Write a comment..."
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {newComment.length}/500 characters
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSubmitComment()}
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? "Posting..." : "Post Comment"}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 && !isLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 text-gray-400"
          >
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-500" />
            <p>No comments yet. Be the first to comment!</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => renderComment(comment))}
          </AnimatePresence>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto"
            />
          </motion.div>
        )}

        <Pagination
          currentPage={page}
          totalPages={Math.ceil((comments.length + (hasMore ? 1 : 0)) / 10)}
          totalItems={comments.length}
          itemsPerPage={10}
          onPageChange={(newPage) => fetchComments(newPage)}
          showInfo={false}
          className="mt-6"
        />
      </div>
    </div>
  );
}
