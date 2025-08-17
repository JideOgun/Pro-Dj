"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import WaveformPlayer from "@/components/WaveformPlayer";
import { motion } from "framer-motion";
import MixUpload from "@/components/MixUpload";
import MixActionsDropdown from "@/components/MixActionsDropdown";
import ShareModal from "@/components/ShareModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Upload, Plus, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface DjMix {
  id: string;
  title: string;
  duration: number;
  s3Key: string;
  cloudFrontUrl: string | null;
  localUrl: string;
  createdAt: string;
  dj: {
    id: string;
    stageName: string;
    userId: string;
  };
}

export default function MixesPage() {
  const { data: session } = useSession();
  const [mixes, setMixes] = useState<DjMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMix, setSelectedMix] = useState<DjMix | null>(null);
  const [mixToDelete, setMixToDelete] = useState<DjMix | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMixes();
  }, [page, sortBy]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchMixes = async () => {
    try {
      const response = await fetch(
        `/api/mixes?page=${page}&limit=10&sortBy=${sortBy}`
      );
      const data = await response.json();

      if (data.ok) {
        if (page === 1) {
          setMixes(data.mixes);
        } else {
          setMixes((prev) => [...prev, ...data.mixes]);
        }
        setHasMore(data.mixes.length === 10);
      }
    } catch (error) {
      console.error("Failed to fetch mixes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mixId: string) => {
    const mix = mixes.find((m) => m.id === mixId);
    if (!mix) return;

    // Set the mix to delete and show confirmation modal
    setMixToDelete(mix);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!mixToDelete) return;

    try {
      const response = await fetch(`/api/mixes/${mixToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setMixes((prev) => prev.filter((mix) => mix.id !== mixToDelete.id));
        // Show success toast notification
        toast.success(`"${mixToDelete.title}" has been deleted successfully.`);
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to delete mix: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error deleting mix:", error);
      toast.error("Failed to delete mix. Please try again.");
    }
  };

  const formatDuration = (seconds: number) => {
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

  const handleShare = (mix: DjMix) => {
    setSelectedMix(mix);
    setShowShareModal(true);
  };

  const canDeleteMix = (mix: DjMix) => {
    if (!session?.user) return false;
    if (session.user.role === "ADMIN") return true;
    if (session.user.role === "DJ") {
      // Check if the current user is the DJ who uploaded this mix
      return mix.dj.userId === session.user.id;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">DJ Mixes</h1>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-800 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">DJ Mixes</h1>
              <p className="text-gray-400">
                Welcome back, {session?.user?.name || "DJ"}! 🎵
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Mix
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 text-white px-4 py-2 rounded-lg transition-colors border border-gray-700/50"
              >
                <span>
                  Sort by:{" "}
                  {sortBy === "newest"
                    ? "Newest"
                    : sortBy === "popular"
                    ? "Most Popular"
                    : sortBy === "oldest"
                    ? "Oldest"
                    : sortBy}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showSortDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[200px]">
                  <button
                    onClick={() => {
                      setSortBy("newest");
                      setShowSortDropdown(false);
                      setPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                      sortBy === "newest"
                        ? "text-violet-400 bg-gray-700"
                        : "text-white"
                    }`}
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("popular");
                      setShowSortDropdown(false);
                      setPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                      sortBy === "popular"
                        ? "text-violet-400 bg-gray-700"
                        : "text-white"
                    }`}
                  >
                    Most Popular
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("oldest");
                      setShowSortDropdown(false);
                      setPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                      sortBy === "oldest"
                        ? "text-violet-400 bg-gray-700"
                        : "text-white"
                    }`}
                  >
                    Oldest First
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {mixes.map((mix) => (
            <motion.div
              key={mix.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/70 hover:to-gray-900/70 transition-all duration-300 rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 shadow-lg hover:shadow-xl"
            >
              {/* Audio Player - Full Width */}
              <div className="mb-4">
                <WaveformPlayer
                  src={`/api/mixes/stream?id=${mix.id}`}
                  title={mix.title}
                  artist={mix.dj.stageName}
                  duration={mix.duration}
                  onShare={() => handleShare(mix)}
                  albumArtUrl={mix.albumArtUrl}
                  className="w-full"
                />
              </div>

              {/* Mix Info */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white truncate mb-1">
                    {mix.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    by{" "}
                    <span className="text-violet-400 font-medium">
                      {mix.dj.stageName}
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400 flex-shrink-0">
                  <div className="bg-gray-800/50 px-3 py-1 rounded-lg font-mono">
                    {formatDuration(mix.duration)}
                  </div>
                  <div className="text-gray-500">•</div>
                  <div>{formatDate(mix.createdAt)}</div>
                  <MixActionsDropdown
                    mixId={mix.id}
                    mixTitle={mix.title}
                    onDelete={handleDelete}
                    onShare={() => handleShare(mix)}
                    canDelete={canDeleteMix(mix)}
                    canDownload={true} // Everyone can download
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Load More Mixes
            </button>
          </div>
        )}

        {mixes.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No mixes found</div>
            <p className="text-gray-500 mb-4">
              Upload your first mix to get started!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Mix
              </button>
              <a
                href="/dashboard/dj"
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <MixUpload
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={(newMix) => {
              setMixes((prev) => [newMix, ...prev]);
              setShowUploadModal(false);
            }}
          />
        )}

        {/* Share Modal */}
        {showShareModal && selectedMix && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => {
              setShowShareModal(false);
              setSelectedMix(null);
            }}
            title={selectedMix.title}
            artist={selectedMix.dj.stageName}
            url={`${window.location.origin}/mixes/${selectedMix.id}`}
            description="Check out this amazing mix on Pro-DJ!"
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && mixToDelete && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setMixToDelete(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Mix"
            itemName={mixToDelete.title}
            itemType="mix"
          />
        )}
      </div>
    </div>
  );
}
