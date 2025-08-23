"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import WaveformPlayer from "@/components/WaveformPlayer";
import { motion } from "framer-motion";
import MixUpload from "@/components/MixUpload";
import MixActionsDropdown from "@/components/MixActionsDropdown";
import ShareModal from "@/components/ShareModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import CommentSection from "@/components/CommentSection";
import SimpleCommentInput from "@/components/SimpleCommentInput";
import SuggestedMixes from "@/components/SuggestedMixes";
import LoadingSpinner from "@/components/LoadingSpinner";
import RepostButton from "@/components/RepostButton";
import FollowButton from "@/components/FollowButton";
import { useSocketContext } from "@/components/SocketProvider";
import { Upload, Plus, ChevronDown, Filter, Search } from "lucide-react";
import toast from "react-hot-toast";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { FreeUploadCounter } from "@/components/FreeUploadCounter";

// Predefined list of genres for filtering
const GENRES = [
  "All Genres",
  "Afrobeats",
  "Amapiano",
  "Hip-Hop",
  "R&B",
  "House",
  "Techno",
  "Trance",
  "Dubstep",
  "Drum & Bass",
  "Jazz",
  "Soul",
  "Funk",
  "Disco",
  "Reggae",
  "Dancehall",
  "Pop",
  "Rock",
  "Electronic",
  "Ambient",
  "Chillout",
  "Lounge",
  "Classical",
  "Country",
  "Blues",
  "Gospel",
  "Latin",
  "Caribbean",
  "World Music",
  "Alternative",
  "Indie",
  "Other",
];

interface DjMix {
  id: string;
  title: string;
  duration: number;
  s3Key: string;
  cloudFrontUrl: string | null;
  localUrl: string;
  createdAt: string;
  genre: string;
  tags: string[];
  userLiked: boolean;
  likeCount: number;
  dj: {
    id: string;
    stageName: string;
    userId: string;
    userProfileImage: string | null;
  };
}

function MixesPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, isConnected } = useSocketContext();
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
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const genreFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMixes();
  }, [page, sortBy, selectedGenre, searchQuery]);

  // Handle success/cancel messages from Stripe checkout
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast.success(
        "Subscription created successfully! Welcome to Pro-DJ Premium!"
      );
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === "true") {
      toast.error("Subscription was canceled. You can try again anytime.");
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

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
      setMixes((prevMixes) =>
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

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
      if (
        genreFilterRef.current &&
        !genreFilterRef.current.contains(event.target as Node)
      ) {
        setShowGenreFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchMixes = async () => {
    try {
      const djId = searchParams.get("djId");
      const genreParam =
        selectedGenre !== "All Genres"
          ? `&genre=${encodeURIComponent(selectedGenre)}`
          : "";
      const searchParam = searchQuery
        ? `&search=${encodeURIComponent(searchQuery)}`
        : "";
      const djIdParam = djId ? `&djId=${djId}` : "";
      const response = await fetch(
        `/api/mixes?page=${page}&limit=10&sortBy=${sortBy}${genreParam}${searchParam}${djIdParam}`
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setPage(1); // Reset to first page when searching
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleDelete = async (mixId: string) => {
    const mix = mixes.find((m) => m.id === mixId);
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

    // Set the mix to delete and show confirmation modal
    setMixToDelete(mix);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!mixToDelete) return;

    try {
      const response = await fetch(`/api/mixes/${mixToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        // Remove the mix from the list immediately
        setMixes((prev) => prev.filter((m) => m.id !== mixToDelete.id));

        // Show success message with mix title
        toast.success(`"${mixToDelete.title}" has been deleted successfully`, {
          duration: 3000,
          icon: "🗑️",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });

        // Close modal and clear state
        setShowDeleteModal(false);
        setMixToDelete(null);
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
      setMixToDelete(null);
    }
  };

  const handleShare = (mix: DjMix) => {
    setSelectedMix(mix);
    setShowShareModal(true);
  };

  const canDeleteMix = (mix: DjMix) => {
    return (
      session?.user?.role === "ADMIN" || mix.dj.userId === session?.user?.id
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
      month: "short",
      day: "numeric",
    });
  };

  if (loading && mixes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Loading amazing mixes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">DJ Mixes</h1>
              <p className="text-gray-300 text-lg">
                Discover amazing mixes from talented DJs
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search mixes by title or DJ name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Genre Filter */}
              <div className="relative" ref={genreFilterRef}>
                <button
                  onClick={() => setShowGenreFilter(!showGenreFilter)}
                  className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="mr-2">{selectedGenre}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showGenreFilter ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showGenreFilter && (
                  <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {GENRES.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => {
                          setSelectedGenre(genre);
                          setShowGenreFilter(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${
                          selectedGenre === genre
                            ? "text-violet-400 bg-gray-700"
                            : ""
                        } ${
                          genre === "All Genres"
                            ? "border-b border-gray-600"
                            : ""
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <span className="mr-2">
                    Sort by: {sortBy === "newest" ? "Newest" : "Oldest"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showSortDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        setSortBy("newest");
                        setShowSortDropdown(false);
                        setPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-700 rounded-t-lg ${
                        sortBy === "newest" ? "text-violet-400" : ""
                      }`}
                    >
                      Newest First
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("oldest");
                        setShowSortDropdown(false);
                        setPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-700 rounded-b-lg ${
                        sortBy === "oldest" ? "text-violet-400" : ""
                      }`}
                    >
                      Oldest First
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Button and Free Upload Counter */}
              {(session?.user?.role === "DJ" ||
                session?.user?.role === "ADMIN") && (
                <div className="flex items-center gap-3">
                  <FreeUploadCounter />
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Mix
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content and Sidebar Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8 items-start">
          {/* Main Content */}
          <div className="md:col-span-2 lg:col-span-3">
            {/* Mixes Grid */}
            <div className="space-y-6 lg:space-y-8">
              {mixes.map((mix, index) => (
                <motion.div
                  key={mix.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
                >
                  {/* Mix Header - Clickable for navigation */}
                  <div
                    className="flex items-center justify-between mb-3 cursor-pointer"
                    onClick={() => router.push(`/mixes/${mix.id}`)}
                  >
                    <h3 className="text-lg font-semibold text-white truncate flex-1">
                      {mix.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <RepostButton
                        mixId={mix.id}
                        djUserId={mix.dj.userId}
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MixActionsDropdown
                        mixId={mix.id}
                        mixTitle={mix.title}
                        onDelete={() => handleDelete(mix.id)}
                        onShare={() => handleShare(mix)}
                        canDelete={canDeleteMix(mix)}
                        canDownload={true}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Audio Player - Non-clickable, controls only */}
                  <div
                    className="audio-player-container mb-3"
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
                        showLikeButton={true}
                        className="w-full max-w-full"
                      />
                    </div>
                  </div>

                  {/* Mix Info - Clickable for navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400 mb-3 space-y-2 sm:space-y-0">
                    <div
                      className="flex items-center space-x-2 sm:space-x-3 flex-wrap cursor-pointer"
                      onClick={() => router.push(`/mixes/${mix.id}`)}
                    >
                      <div className="flex items-center space-x-2">
                        {mix.dj.userProfileImage ? (
                          <img
                            src={mix.dj.userProfileImage}
                            alt={mix.dj.stageName}
                            className="w-4 h-4 rounded-full flex-shrink-0 object-cover"
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
                    <div onClick={(e) => e.stopPropagation()}>
                      <FollowButton userId={mix.dj.userId} size="sm" />
                    </div>
                  </div>

                  {/* Simple Comment Input - Non-clickable */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <SimpleCommentInput commentType="mix" itemId={mix.id} />
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
                  {session?.user?.role === "DJ" ||
                  session?.user?.role === "ADMIN"
                    ? "Upload your first mix to get started!"
                    : "No mixes have been uploaded yet. Check back soon for amazing DJ performances!"}
                </p>
                {(session?.user?.role === "DJ" ||
                  session?.user?.role === "ADMIN") && (
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
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 lg:col-span-2 lg:sticky lg:top-8">
            <SuggestedMixes />
          </div>
        </div>

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

export default function MixesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MixesPageContent />
    </Suspense>
  );
}
