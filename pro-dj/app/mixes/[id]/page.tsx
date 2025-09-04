"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import WaveformPlayer from "@/components/WaveformPlayer";
import MixActionsDropdown from "@/components/MixActionsDropdown";
import ShareModal from "@/components/ShareModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import CommentSection from "@/components/CommentSection";
import SuggestedMixes from "@/components/SuggestedMixes";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import toast from "react-hot-toast";
import { useSocketContext } from "@/components/SocketProvider";

interface DjMix {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  s3Key: string;
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
    userProfileImage: string | null;
  };
  userLiked: boolean;
  likeCount: number;
}

export default function MixDetailPage() {
  const { data: session } = useSession();
  const { joinMixRoom, leaveMixRoom, socket, isConnected } = useSocketContext();
  const router = useRouter();
  const { id } = useParams();
  const mixId = id as string;

  const [mix, setMix] = useState<DjMix | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (mixId) {
      fetchMix();
    }
  }, [mixId]);

  // Join mix room for real-time updates
  useEffect(() => {
    if (mixId) {
      joinMixRoom(mixId);

      // Cleanup: leave room when component unmounts
      return () => {
        leaveMixRoom(mixId);
      };
    }
  }, [mixId, joinMixRoom, leaveMixRoom]);

  // Listen for real-time mix like updates (global)
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMixLikeUpdate = (data: {
      mixId: string;
      userId: string;
      liked: boolean;
      likeCount: number;
    }) => {
      if (data.mixId === mixId) {
        // Update the mix like count
        setMix((prevMix) =>
          prevMix ? { ...prevMix, likeCount: data.likeCount } : prevMix
        );
      }
    };

    socket.on("mix-like-updated", handleMixLikeUpdate);

    return () => {
      socket.off("mix-like-updated", handleMixLikeUpdate);
    };
  }, [socket, isConnected, mixId]);

  const fetchMix = async () => {
    try {
      const response = await fetch(`/api/mixes/${mixId}`);
      const data = await response.json();

      if (data.ok) {
        setMix(data.mix);
      } else {
        toast.error("Mix not found");
      }
    } catch (error) {
      console.error("Failed to fetch mix:", error);
      toast.error("Failed to load mix");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!mix) return;

    // Check if user is authenticated first
    if (!session?.user?.id) {
      toast.error("Please sign in to delete mixes");
      // Redirect to login page
      router.push(
        "/auth?callbackUrl=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    // Check if user has permission to delete this mix
    const canDelete =
      session.user.role === "ADMIN" || mix.dj.userId === session.user.id;
    if (!canDelete) {
      toast.error("You don't have permission to delete this mix");
      return;
    }

    // Show confirmation modal
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!mix) return;

    try {
      const response = await fetch(`/api/mixes/${mix.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success(`"${mix.title}" has been deleted successfully`, {
          duration: 3000,
          icon: "🗑️",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
        // Redirect to mixes page immediately after successful deletion
        router.push("/mixes");
        return; // Exit early to prevent any further processing
      } else {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 401) {
          toast.error("Please sign in to delete mixes");
          router.push(
            "/auth?callbackUrl=" + encodeURIComponent(window.location.pathname)
          );
        } else if (response.status === 403) {
          toast.error("You don't have permission to delete this mix");
        } else if (response.status === 404) {
          toast.error("Mix not found");
        } else {
          toast.error(errorData.error || "Failed to delete mix");
        }
      }
    } catch (error) {
      console.error("Error deleting mix:", error);
      toast.error("Failed to delete mix");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const canDeleteMix = (mix: DjMix) => {
    return (
      session?.user?.id === mix.dj.userId || session?.user?.role === "ADMIN"
    );
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading mix...</div>
      </div>
    );
  }

  if (!mix) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-4">Mix not found</div>
          <Link href="/mixes" className="text-violet-400 hover:text-violet-300">
            Back to Mixes
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
          <div className="flex items-center justify-between">
            <Link
              href="/mixes"
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Mixes
            </Link>
            <MixActionsDropdown
              mixId={mix.id}
              mixTitle={mix.title}
              onDelete={() => setShowDeleteModal(true)}
              onShare={() => setShowShareModal(true)}
              canDelete={canDeleteMix(mix)}
              canDownload={true}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Mix Player */}
            <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">{mix.title}</h1>
                {mix.description && (
                  <p className="text-gray-300 mb-4">{mix.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center">
                    {mix.dj.userProfileImage ? (
                      <>
                        <img
                          src={mix.dj.userProfileImage}
                          alt={mix.dj.stageName}
                          className="w-5 h-5 rounded-full mr-2 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList?.remove(
                              "hidden"
                            );
                          }}
                        />
                        <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center mr-2 hidden">
                          <span className="text-xs text-gray-300 font-medium">
                            {mix.dj.stageName.charAt(0)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs text-gray-300 font-medium">
                          {mix.dj.stageName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-violet-400 font-medium">
                      {mix.dj.stageName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(mix.duration)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(mix.createdAt)}
                  </div>
                </div>
              </div>

              {/* Waveform Player */}
              <WaveformPlayer
                src={mix.cloudFrontUrl || mix.localUrl}
                title={mix.title}
                artist={mix.dj.stageName}
                albumArtUrl={mix.albumArtUrl}
                duration={mix.duration}
                className="w-full"
                mixId={mix.id}
                initialLiked={mix.userLiked || false}
                initialLikeCount={mix.likeCount || 0}
                showLikeButton={true}
              />

              {/* Mix Actions - positioned below the player */}
              <div className="flex justify-end mt-4">
                <MixActionsDropdown
                  mixId={mix.id}
                  mixTitle={mix.title}
                  onDelete={() => setShowDeleteModal(true)}
                  onShare={() => setShowShareModal(true)}
                  canDelete={canDeleteMix(mix)}
                  canDownload={true}
                />
              </div>

              {/* Stats */}
              <div className="mt-6 flex items-center space-x-6 text-sm text-gray-400">
                <div>
                  <span className="font-medium">{mix.playCount}</span> plays
                </div>
                <div>
                  <span className="font-medium">{mix.downloadCount}</span>{" "}
                  downloads
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6">
              <h2 className="text-xl font-semibold mb-6">Comments</h2>
              <CommentSection commentType="mix" itemId={mix.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 h-full">
              <h3 className="text-lg font-semibold mb-4">About this Mix</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2">DJ</div>
                  <div className="flex items-center space-x-3">
                    {mix.dj.userProfileImage ? (
                      <>
                        <img
                          src={mix.dj.userProfileImage}
                          alt={mix.dj.stageName}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList?.remove(
                              "hidden"
                            );
                          }}
                        />
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center hidden">
                          <span className="text-lg text-gray-300 font-medium">
                            {mix.dj.stageName.charAt(0)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-lg text-gray-300 font-medium">
                          {mix.dj.stageName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white">
                        {mix.dj.stageName}
                      </div>
                      <div className="text-sm text-gray-400">DJ</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Duration</div>
                  <div className="font-medium">
                    {formatDuration(mix.duration)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Uploaded</div>
                  <div className="font-medium">{formatDate(mix.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Plays</div>
                  <div className="font-medium">{mix.playCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Downloads</div>
                  <div className="font-medium">{mix.downloadCount}</div>
                </div>
              </div>
            </div>

            <SuggestedMixes currentMixId={mix.id} />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={mix.title}
          artist={mix.dj.stageName}
          url={`${window.location.origin}/mixes/${mix.id}`}
          description="Check out this amazing mix on Pro-DJ!"
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete Mix"
          itemName={mix.title}
          itemType="mix"
        />
      )}
    </div>
  );
}
