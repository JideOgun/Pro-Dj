"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import WaveformPlayer from "@/components/WaveformPlayer";
import { motion } from "framer-motion";

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
  };
}

export default function MixesPage() {
  const { data: session } = useSession();
  const [mixes, setMixes] = useState<DjMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchMixes();
  }, [page]);

  const fetchMixes = async () => {
    try {
      const response = await fetch(`/api/mixes?page=${page}&limit=10`);
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
    if (!confirm("Are you sure you want to delete this mix?")) return;

    try {
      const response = await fetch(`/api/mixes/${mixId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setMixes((prev) => prev.filter((mix) => mix.id !== mixId));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete mix: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting mix:", error);
      alert("Failed to delete mix");
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
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">DJ Mixes</h1>

        <div className="space-y-4">
          {mixes.map((mix) => (
            <motion.div
              key={mix.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800/70 hover:to-gray-900/70 transition-all duration-300 rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center space-x-6">
                {/* Audio Player */}
                <div className="flex-shrink-0">
                  <WaveformPlayer
                    src={mix.cloudFrontUrl || mix.localUrl || null}
                    title={mix.title}
                    artist={mix.dj.stageName}
                    duration={mix.duration}
                    className=""
                  />
                </div>

                {/* Mix Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
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
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="bg-gray-800/50 px-3 py-1 rounded-lg font-mono">
                        {formatDuration(mix.duration)}
                      </div>
                      <div className="text-gray-500">•</div>
                      <div>{formatDate(mix.createdAt)}</div>
                      {session?.user && (
                        <>
                          <div className="text-gray-500">•</div>
                          <button
                            onClick={() => handleDelete(mix.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200 opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-900/20"
                            title="Delete mix"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
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
            <p className="text-gray-500">
              Upload your first mix to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
