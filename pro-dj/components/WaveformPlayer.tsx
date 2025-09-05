"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Share2,
  X,
  Maximize2,
} from "lucide-react";
import Image from "next/image";
import LikeButton from "./LikeButton";
import RepostButton from "./RepostButton";
import { useSocketContext } from "./SocketProvider";

interface WaveformPlayerProps {
  src: string;
  title: string;
  artist: string;
  duration: number | null;
  albumArtUrl?: string | null;
  mixId?: string;
  djUserId?: string; // Add DJ user ID for repost button
  initialLiked?: boolean;
  initialLikeCount?: number;
  showLikeButton?: boolean;
  showRepostButton?: boolean;
  className?: string;
  onShare?: () => void;
  onPlayStart?: () => void; // New prop for global audio management
  compact?: boolean; // Compact mode for feed items
  mini?: boolean; // Mini mode for sidebar
}

export default function WaveformPlayer({
  src,
  title,
  artist,
  albumArtUrl,
  className = "",
  mixId,
  djUserId,
  initialLiked = false,
  initialLikeCount = 0,
  showLikeButton = false,
  showRepostButton = false,
  onShare,
  onPlayStart,
  compact = false,
  mini = false,
}: WaveformPlayerProps) {
  const { isConnected, emitMixPlayed } = useSocketContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration_, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showVolumePreview, setShowVolumePreview] = useState(false);
  const [hasEmittedPlayCount, setHasEmittedPlayCount] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const mediaSourceCreatedRef = useRef<boolean>(false);

  // Generate gradient class based on title
  const gradientClass = (() => {
    const hash = title.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const gradients = [
      "from-violet-500 to-purple-600",
      "from-blue-500 to-cyan-600",
      "from-green-500 to-emerald-600",
      "from-orange-500 to-red-600",
      "from-pink-500 to-rose-600",
      "from-indigo-500 to-blue-600",
      "from-yellow-500 to-orange-600",
      "from-teal-500 to-green-600",
    ];
    return gradients[Math.abs(hash) % gradients.length];
  })();

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Stop other audio elements before starting this one
      if (typeof window !== "undefined") {
        const audioElements = document.querySelectorAll("audio");
        audioElements.forEach((audio) => {
          if (audio !== audioRef.current) {
            audio.pause();
            audio.currentTime = 0;
          }
        });
      }

      // Call onPlayStart callback if provided
      if (onPlayStart) {
        onPlayStart();
      }

      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        setError("Failed to play audio");
      });
    }
  }, [isPlaying, onPlayStart]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
    },
    []
  );

  const skip = useCallback(
    (seconds: number) => {
      if (!audioRef.current) return;
      const newTime = Math.max(
        0,
        Math.min(audioRef.current.currentTime + seconds, duration_)
      );
      audioRef.current.currentTime = newTime;
    },
    [duration_]
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!audioRef.current || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration_;

      audioRef.current.currentTime = newTime;
    },
    [duration_]
  );

  const handleProgressBarHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const hoverTimeValue = percentage * duration_;
      setHoverTime(hoverTimeValue);
    },
    [duration_]
  );

  const handleProgressBarLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !progressBarRef.current) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration_;

      audioRef.current.currentTime = newTime;
    },
    [duration_]
  );

  // Mouse event handlers for waveform
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDragging(true);
      handleSeek(e);
    },
    [handleSeek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) {
        handleSeek(e);
      }
    },
    [isDragging, handleSeek]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);

      // Emit play count update when mix starts playing (only once per session)
      if (mixId && isConnected && !hasEmittedPlayCount) {
        // Increment play count by 1 for this play event
        const newPlayCount = (initialLikeCount || 0) + 1; // Note: This should be initialPlayCount, not initialLikeCount
        emitMixPlayed(mixId, newPlayCount);
        setHasEmittedPlayCount(true);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError("Failed to load audio");
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
    };
  }, [emitMixPlayed, hasEmittedPlayCount, initialLikeCount, isConnected, mixId]);

  // Volume effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Waveform visualization
  useEffect(() => {
    if (!isExpanded || !audioRef.current || !canvasRef.current) return;

    const audio = audioRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const setupAudioContext = async () => {
      try {
        // Check if we've already created a media source for this audio element
        if (mediaSourceCreatedRef.current) {
          return;
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;

        // Check if audio context is suspended and resume it
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;

        // Create media source only once per audio element
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        mediaSourceCreatedRef.current = true;

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!ctx || !analyser) return;

          const width = canvas.width;
          const height = canvas.height;

          ctx.clearRect(0, 0, width, height);
          analyser.getByteFrequencyData(dataArray);

          const barWidth = (width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * height;

            const gradient = ctx.createLinearGradient(
              0,
              height - barHeight,
              0,
              height
            );
            gradient.addColorStop(0, "#8b5cf6");
            gradient.addColorStop(1, "#a855f7");

            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
          }

          animationFrameRef.current = requestAnimationFrame(draw);
        };

        draw();
      } catch (error) {
        console.error("Error setting up audio context:", error);
        // If there's an error, we'll skip the visualization but not break the audio
      }
    };

    setupAudioContext();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isExpanded, isPlaying]);

  // Reset media source flag when audio source changes
  useEffect(() => {
    mediaSourceCreatedRef.current = false;
  }, [src]);

  return (
    <div className={`${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" data-mix-id={mixId} />

      {!isExpanded ? (
        // Minimized player
        <motion.div
          key="minimized"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg ${
            mini ? "p-0.5" : compact ? "p-3" : "p-4"
          }`}
        >
          <div
            className={`flex items-center ${mini ? "space-x-0" : "space-x-4"}`}
          >
            {/* Album Art */}
            <div className="flex-shrink-0">
              <div
                className={`${
                  mini ? "w-6 h-6" : compact ? "w-10 h-10" : "w-12 h-12"
                } rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}
              >
                {albumArtUrl ? (
                  <Image
                    src={albumArtUrl}
                    alt={title}
                    width={200}
                    height={200}
                    className="w-full h-full rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-white text-lg font-bold">
                    {title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div
                className={`text-white font-medium truncate ${
                  mini ? "text-xs" : compact ? "text-sm" : "text-base"
                }`}
              >
                {title} • {artist}
              </div>
            </div>

            {/* Controls */}
            <div
              className={`flex items-center flex-shrink-0 ${
                mini ? "space-x-0" : "space-x-2"
              }`}
            >
              {/* Like Button */}
              {showLikeButton && mixId && (
                <div onClick={(e) => e.stopPropagation()}>
                  <LikeButton
                    mixId={mixId}
                    initialLiked={initialLiked}
                    initialLikeCount={initialLikeCount}
                    size="sm"
                  />
                </div>
              )}

              {/* Repost Button */}
              {showRepostButton && mixId && (
                <div onClick={(e) => e.stopPropagation()}>
                  <RepostButton mixId={mixId} djUserId={djUserId} size="sm" />
                </div>
              )}

              {/* Volume Control */}
              {!mini && (
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-700/50"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </motion.button>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleVolumeChange(e);
                      }}
                      onMouseEnter={() => setShowVolumePreview(true)}
                      onMouseLeave={() => setShowVolumePreview(false)}
                      className="w-16 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <AnimatePresence>
                      {showVolumePreview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg"
                        >
                          {Math.round(volume * 100)}%
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Play Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                disabled={isLoading}
                className={`${
                  mini ? "w-4 h-4" : "w-10 h-10"
                } bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg`}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className={`${
                      mini ? "w-1.5 h-1.5" : "w-4 h-4"
                    } border-2 border-white border-t-transparent rounded-full`}
                  />
                ) : isPlaying ? (
                  <Pause
                    className={`${mini ? "w-1.5 h-1.5" : "w-4 h-4"} text-white`}
                  />
                ) : (
                  <Play
                    className={`${
                      mini ? "w-1.5 h-1.5" : "w-4 h-4"
                    } text-white ${mini ? "" : "ml-0.5"}`}
                  />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      ) : (
        // Full expanded player
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 shadow-2xl w-full max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Album Art */}
              <div className="flex-shrink-0">
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}
                >
                  {albumArtUrl ? (
                    <Image
                      src={albumArtUrl}
                      alt={title}
                      fill
                      className="rounded-xl object-cover"
                      onError={() => {
                        // Handle error by hiding the image
                      }}
                    />
                  ) : (
                    <div className="text-white text-2xl font-bold">
                      {title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-white text-lg font-semibold truncate">
                  {title}
                </h2>
                <p className="text-gray-400 truncate">{artist}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="text-sm text-gray-400 font-mono bg-gray-800/50 px-3 py-1 rounded-lg">
                {formatTime(currentTime)} / {formatTime(duration_)}
              </div>

              {/* Like Button */}
              {showLikeButton && mixId && (
                <LikeButton
                  mixId={mixId}
                  initialLiked={initialLiked}
                  initialLikeCount={initialLikeCount}
                  size="md"
                />
              )}

              {/* Share Button */}
              {onShare && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onShare}
                  className="text-gray-400 hover:text-violet-400 transition-colors p-2 rounded-full hover:bg-gray-700/50"
                  title="Share mix"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Waveform */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={80}
              className="w-full h-16 cursor-pointer rounded-xl overflow-hidden bg-gray-900/30 border border-gray-700/30"
              onClick={handleSeek}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between space-x-4"
          >
            <div className="flex items-center space-x-3 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay}
                disabled={isLoading}
                className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-0.5" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => skip(-10)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
                title="Skip 10s back"
              >
                <SkipBack className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => skip(10)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
                title="Skip 10s forward"
              >
                <SkipForward className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 mx-6 min-w-0 relative">
              <div
                ref={progressBarRef}
                className="h-3 bg-gray-700/50 rounded-full overflow-hidden cursor-pointer relative"
                onMouseMove={handleProgressBarHover}
                onMouseLeave={handleProgressBarLeave}
                onClick={handleProgressBarClick}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full relative"
                  style={{
                    width: `${(currentTime / (duration_ || 1)) * 100}%`,
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(currentTime / (duration_ || 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.1 }}
                />

                {/* Hover Preview */}
                <AnimatePresence>
                  {hoverTime !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute top-full left-0 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10"
                      style={{
                        left: `${(hoverTime / (duration_ || 1)) * 100}%`,
                      }}
                    >
                      {formatTime(hoverTime)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </motion.button>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  onMouseEnter={() => setShowVolumePreview(true)}
                  onMouseLeave={() => setShowVolumePreview(false)}
                  className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <AnimatePresence>
                  {showVolumePreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg"
                    >
                      {Math.round(volume * 100)}%
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 bg-red-900/20 border border-red-700/50 rounded-xl"
              >
                <span className="text-sm text-red-400">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Expand Button (only in minimized view) */}
      {!isExpanded && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(true)}
          className="mt-2 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
          title="Expand player"
        >
          <Maximize2 className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}
