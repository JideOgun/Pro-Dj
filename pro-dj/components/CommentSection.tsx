"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Heart,
  ThumbsDown,
  Reply,
  Edit,
  Trash2,
  MoreHorizontal,
  Send,
  User,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "./Pagination";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  likeCount: number;
  dislikeCount: number;
  threadDepth: number;
  user: {
    id: string;
    name: string;
    profileImage: string | null;
    role: string;
  };
  replies: Comment[];
  likes: Array<{ userId: string }>;
  dislikes: Array<{ userId: string }>;
}

interface CommentSectionProps {
  commentType: "mix" | "video" | "post" | "photo";
  itemId: string;
  className?: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  commentType,
  itemId,
  className = "",
}) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [commentType, itemId]);

  const fetchComments = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/comments?type=${commentType}&itemId=${itemId}&page=${pageNum}&limit=10`
      );
      const data = await response.json();

      if (data.ok) {
        if (pageNum === 1) {
          setComments(data.comments);
        } else {
          setComments((prev) => [...prev, ...data.comments]);
        }
        setHasMore(data.pagination.hasNextPage);
        setPage(data.pagination.page);
      } else {
        toast.error("Failed to load comments");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (parentId?: string) => {
    if (!session?.user) {
      toast.error("Please log in to comment");
      return;
    }

    const content = parentId ? editContent : newComment;
    if (!content.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

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
          // Update the reply in the comments
          setComments((prev) =>
            prev.map((comment) => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  replies: [...comment.replies, data.comment],
                };
              }
              return comment;
            })
          );
          setReplyingTo(null);
          setEditContent("");
        } else {
          // Add new top-level comment
          setComments((prev) => [data.comment, ...prev]);
          setNewComment("");
        }
        toast.success("Comment posted successfully");
      } else {
        toast.error(data.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    }
  };

  const handleLike = async (commentId: string) => {
    if (!session?.user) {
      toast.error("Please log in to like comments");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        // Update the comment's like status
        updateCommentLikeStatus(commentId, data.liked);
      } else {
        toast.error(data.error || "Failed to like comment");
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!session?.user) {
      toast.error("Please log in to dislike comments");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/dislike`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        // Update the comment's dislike status
        updateCommentDislikeStatus(commentId, data.disliked);
      } else {
        toast.error(data.error || "Failed to dislike comment");
      }
    } catch (error) {
      console.error("Error disliking comment:", error);
      toast.error("Failed to dislike comment");
    }
  };

  const updateCommentLikeStatus = (commentId: string, liked: boolean) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          const isLiked = comment.likes.some(
            (like) => like.userId === session?.user?.id
          );
          const isDisliked = comment.dislikes.some(
            (dislike) => dislike.userId === session?.user?.id
          );

          let newLikes = [...comment.likes];
          let newDislikes = [...comment.dislikes];
          let newLikeCount = comment.likeCount;
          let newDislikeCount = comment.dislikeCount;

          if (liked && !isLiked) {
            newLikes.push({ userId: session!.user!.id });
            newLikeCount++;
            if (isDisliked) {
              newDislikes = newDislikes.filter(
                (dislike) => dislike.userId !== session?.user?.id
              );
              newDislikeCount--;
            }
          } else if (!liked && isLiked) {
            newLikes = newLikes.filter(
              (like) => like.userId !== session?.user?.id
            );
            newLikeCount--;
          }

          return {
            ...comment,
            likes: newLikes,
            dislikes: newDislikes,
            likeCount: newLikeCount,
            dislikeCount: newDislikeCount,
          };
        }
        return comment;
      })
    );
  };

  const updateCommentDislikeStatus = (commentId: string, disliked: boolean) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          const isLiked = comment.likes.some(
            (like) => like.userId === session?.user?.id
          );
          const isDisliked = comment.dislikes.some(
            (dislike) => dislike.userId === session?.user?.id
          );

          let newLikes = [...comment.likes];
          let newDislikes = [...comment.dislikes];
          let newLikeCount = comment.likeCount;
          let newDislikeCount = comment.dislikeCount;

          if (disliked && !isDisliked) {
            newDislikes.push({ userId: session!.user!.id });
            newDislikeCount++;
            if (isLiked) {
              newLikes = newLikes.filter(
                (like) => like.userId !== session?.user?.id
              );
              newLikeCount--;
            }
          } else if (!disliked && isDisliked) {
            newDislikes = newDislikes.filter(
              (dislike) => dislike.userId !== session?.user?.id
            );
            newDislikeCount--;
          }

          return {
            ...comment,
            likes: newLikes,
            dislikes: newDislikes,
            likeCount: newLikeCount,
            dislikeCount: newDislikeCount,
          };
        }
        return comment;
      })
    );
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                content: data.comment.content,
                isEdited: true,
                updatedAt: data.comment.updatedAt,
              };
            }
            return comment;
          })
        );
        setEditingComment(null);
        setEditContent("");
        toast.success("Comment updated successfully");
      } else {
        toast.error(data.error || "Failed to update comment");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
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
        toast.success("Comment deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const canModifyComment = (comment: Comment) => {
    return (
      session?.user?.id === comment.user.id || session?.user?.role === "ADMIN"
    );
  };

  const isLiked = (comment: Comment) => {
    return comment.likes.some((like) => like.userId === session?.user?.id);
  };

  const isDisliked = (comment: Comment) => {
    return comment.dislikes.some(
      (dislike) => dislike.userId === session?.user?.id
    );
  };

  const renderComment = (comment: Comment, isReply = false) => {
    if (comment.isDeleted) {
      return (
        <div className={`text-gray-500 italic ${isReply ? "ml-8" : ""}`}>
          [Comment deleted]
        </div>
      );
    }

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${
          isReply ? "ml-8" : ""
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {comment.user.profileImage ? (
              <img
                src={comment.user.profileImage}
                alt={comment.user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-gray-900">
                {comment.user.name}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder="Edit your comment..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(comment.id)}
                    className="px-3 py-1 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent("");
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 mb-3">{comment.content}</p>
            )}

            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLike(comment.id)}
                className={`flex items-center space-x-1 text-sm ${
                  isLiked(comment)
                    ? "text-violet-600"
                    : "text-gray-500 hover:text-violet-600"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isLiked(comment) ? "fill-current" : ""
                  }`}
                />
                <span>{comment.likeCount}</span>
              </button>

              <button
                onClick={() => handleDislike(comment.id)}
                className={`flex items-center space-x-1 text-sm ${
                  isDisliked(comment)
                    ? "text-red-600"
                    : "text-gray-500 hover:text-red-600"
                }`}
              >
                <ThumbsDown
                  className={`w-4 h-4 ${
                    isDisliked(comment) ? "fill-current" : ""
                  }`}
                />
                <span>{comment.dislikeCount}</span>
              </button>

              {comment.threadDepth < 3 && (
                <button
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setEditContent("");
                    setTimeout(() => commentInputRef.current?.focus(), 100);
                  }}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              )}

              {canModifyComment(comment) && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Reply input */}
            {replyingTo === comment.id && (
              <div className="mt-4 space-y-2">
                <textarea
                  ref={commentInputRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder="Write a reply..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSubmitComment(comment.id)}
                    className="px-3 py-1 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setEditContent("");
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Render replies */}
            {comment.replies.length > 0 && (
              <div className="mt-4 space-y-3">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comment input */}
      {session?.user && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="Write a comment..."
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleSubmitComment()}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Post Comment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
          </div>
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
};

export default CommentSection;
