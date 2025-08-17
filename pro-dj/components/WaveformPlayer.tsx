"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  VolumeX,
  Music,
  Share2,
} from "lucide-react";

interface WaveformPlayerProps {
  src: string | null;
  title: string;
  artist?: string;
  duration?: number;
  className?: string;
  onShare?: () => void;
  albumArtUrl?: string | null;
}

const WaveformPlayer: React.FC<WaveformPlayerProps> = React.memo(
  ({
    src,
    title,
    artist,
    duration = 0,
    className = "",
    onShare,
    albumArtUrl,
  }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const objectUrlRef = useRef<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration_, setDuration] = useState(duration);
    const [volume, setVolume] = useState(0.8);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [waveformData, setWaveformData] = useState<number[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [albumArt, setAlbumArt] = useState<string | null>(null);

    // Format time helper
    const formatTime = useCallback((seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }, []);

    // Extract album art from audio file (placeholder for future implementation)
    const extractAlbumArt = useCallback(async (audioUrl: string) => {
      // For now, return null since we're using manual album art upload
      return null;
    }, []);

    // Generate a gradient based on title for visual appeal
    const generateGradient = useCallback((text: string) => {
      const colors = [
        "from-violet-500 to-purple-600",
        "from-blue-500 to-cyan-600",
        "from-green-500 to-emerald-600",
        "from-orange-500 to-red-600",
        "from-pink-500 to-rose-600",
        "from-indigo-500 to-blue-600",
        "from-yellow-500 to-orange-600",
        "from-teal-500 to-green-600",
      ];

      const hash = text.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      return colors[Math.abs(hash) % colors.length];
    }, []);

    // Initialize Web Audio API for real-time visualization
    const initializeAudioContext = useCallback(() => {
      if (!audioRef.current || audioContextRef.current) return;

      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;

        const source = audioContextRef.current.createMediaElementSource(
          audioRef.current
        );
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        // Don't throw error, just disable visualization
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
      }
    }, []);

    // Initialize audio element
    useEffect(() => {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = "metadata";

        // Event listeners
        audioRef.current.addEventListener("loadedmetadata", () => {
          setDuration(audioRef.current?.duration || 0);
          setIsLoading(false);
          setError(null);
          // Initialize audio context after metadata is loaded
          initializeAudioContext();
        });

        audioRef.current.addEventListener("play", () => {
          setIsPlaying(true);
          // Resume audio context if suspended
          if (audioContextRef.current?.state === "suspended") {
            audioContextRef.current.resume();
          }
        });

        audioRef.current.addEventListener("pause", () => {
          setIsPlaying(false);
        });

        audioRef.current.addEventListener("timeupdate", () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
        });

        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });

        audioRef.current.addEventListener("error", (e) => {
          setError("Failed to load audio");
          setIsLoading(false);
        });

        audioRef.current.addEventListener("loadstart", () => {
          setIsLoading(true);
          setError(null);
        });
      }

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
      };
    }, [initializeAudioContext]);

    // Load audio source
    useEffect(() => {
      if (!src || !audioRef.current) return;

      setIsLoading(true);
      setError(null);

      // Use provided album art URL or try to extract from audio
      if (albumArtUrl) {
        console.log("Setting album art from URL:", albumArtUrl);
        // Test if the image loads successfully
        const img = new Image();
        img.onload = () => {
          setAlbumArt(albumArtUrl);
        };
        img.onerror = () => {
          console.log("Album art failed to load, using fallback");
          setAlbumArt(null);
        };
        img.src = albumArtUrl;
      } else {
        console.log("No album art URL provided, using fallback");
        setAlbumArt(null);
      }

      // Set audio source
      audioRef.current.src = src;
      audioRef.current.load();
    }, [src, albumArtUrl, extractAlbumArt]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
      };
    }, []);

    // Real-time waveform visualization
    useEffect(() => {
      if (!analyserRef.current || !canvasRef.current || !isPlaying) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw waveform bars
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * canvas.height;

          // Color based on playback position
          const barPosition = x / canvas.width;
          const playbackPosition = currentTime / (duration_ || 1);

          if (barPosition <= playbackPosition) {
            ctx.fillStyle = "#8b5cf6"; // Violet for played portion
          } else {
            ctx.fillStyle = "#4b5563"; // Gray for unplayed portion
          }

          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }

        // Draw progress line
        const progressX = (currentTime / (duration_ || 1)) * canvas.width;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(progressX, 0);
        ctx.lineTo(progressX, canvas.height);
        ctx.stroke();
      };

      draw();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isPlaying, currentTime, duration_]);

    // Update slider track gradients when volume changes
    useEffect(() => {
      const updateSliderGradients = () => {
        const sliders = document.querySelectorAll(
          ".slider"
        ) as NodeListOf<HTMLInputElement>;
        sliders.forEach((slider) => {
          const currentVolume = isMuted ? 0 : volume;
          const percentage = (currentVolume / 1) * 100;
          slider.style.background = `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percentage}%, #4b5563 ${percentage}%, #4b5563 100%)`;
        });
      };

      updateSliderGradients();
    }, [volume, isMuted]);

    // Static waveform when not playing
    useEffect(() => {
      if (!canvasRef.current || isPlaying) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 50;
      const barWidth = canvas.width / barCount;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const barHeight =
          Math.random() * canvas.height * 0.3 + canvas.height * 0.1;

        // Color based on playback position
        const barPosition = x / canvas.width;
        const playbackPosition = currentTime / (duration_ || 1);

        if (barPosition <= playbackPosition) {
          ctx.fillStyle = "#8b5cf6"; // Violet for played portion
        } else {
          ctx.fillStyle = "#374151"; // Gray for unplayed portion
        }

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      // Draw progress line
      const progressX = (currentTime / (duration_ || 1)) * canvas.width;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, canvas.height);
      ctx.stroke();
    }, [isPlaying, currentTime, duration_]);

    const togglePlay = useCallback(() => {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          // Don't show error for abort errors (which happen during seeking)
          if (err.name !== "AbortError") {
            setError("Failed to play audio");
          }
        });
      }
    }, [isPlaying]);

    const skip = useCallback((seconds: number) => {
      if (!audioRef.current) return;

      const wasPlaying = !audioRef.current.paused;
      const newTime = Math.max(
        0,
        Math.min(
          audioRef.current.currentTime + seconds,
          audioRef.current.duration
        )
      );

      // Pause briefly to avoid interruption errors
      if (wasPlaying) {
        audioRef.current.pause();
      }

      audioRef.current.currentTime = newTime;

      // Resume if it was playing
      if (wasPlaying) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch((err) => {
              // Silent fail for abort errors during seeking
            });
          }
        }, 10);
      }
    }, []);

    const [isDragging, setIsDragging] = useState(false);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!audioRef.current) return;

      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));

      // Store current play state
      const wasPlaying = !audioRef.current.paused;

      // Pause briefly to avoid interruption errors
      if (wasPlaying) {
        audioRef.current.pause();
      }

      // Set the new time
      audioRef.current.currentTime = percentage * audioRef.current.duration;

      // Resume playback if it was playing before
      if (wasPlaying) {
        // Small delay to ensure the time change is processed
        setTimeout(() => {
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.play().catch((err) => {
              // Only show error if it's not an abort error (which is expected)
              if (err.name !== "AbortError") {
                setError("Failed to resume playback");
              }
            });
          }
        }, 10);
      }
    }, []);

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

    const handleVolumeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
          audioRef.current.volume = newVolume;
        }
        if (newVolume === 0) {
          setIsMuted(true);
        } else if (isMuted) {
          setIsMuted(false);
        }

        // Update slider track gradient
        const slider = e.target;
        const percentage = (newVolume / 1) * 100;
        slider.style.background = `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percentage}%, #4b5563 ${percentage}%, #4b5563 100%)`;
      },
      [isMuted]
    );

    const toggleMute = useCallback(() => {
      if (!audioRef.current) return;
      setIsMuted(!isMuted);
      audioRef.current.muted = !isMuted;
    }, [isMuted]);

    const gradientClass = generateGradient(title);

    return (
      <div className={`w-full ${className}`}>
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Compact player
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              <div className="flex items-center space-x-4">
                {/* Album Art */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}
                  >
                    {albumArt ? (
                      <img
                        src={albumArt}
                        alt="Album Art"
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Music className="w-8 h-8 text-white/80" />
                    )}
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-400 truncate">{artist}</p>
                  </div>

                  {/* Simple Seek Bar */}
                  <div className="mt-2">
                    <div
                      className="h-1 bg-gray-700/30 rounded-full overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = Math.max(
                          0,
                          Math.min(1, x / rect.width)
                        );
                        if (audioRef.current) {
                          audioRef.current.currentTime =
                            percentage * audioRef.current.duration;
                        }
                      }}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-100"
                        style={{
                          width: `${(currentTime / (duration_ || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-2">
                  {/* Volume Control */}
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
                      className="w-16 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Play Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    disabled={isLoading}
                    className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : isPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
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
                      {albumArt ? (
                        <img
                          src={albumArt}
                          alt="Album Art"
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <Music className="w-8 h-8 text-white/80" />
                      )}
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <motion.h4
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-lg font-bold text-white truncate"
                    >
                      {title}
                    </motion.h4>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center space-x-2"
                    >
                      <p className="text-sm text-gray-400 truncate">{artist}</p>
                    </motion.div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-sm text-gray-400 font-mono bg-gray-800/50 px-3 py-1 rounded-lg">
                    {formatTime(currentTime)} / {formatTime(duration_)}
                  </div>

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
                <div className="flex-1 mx-6 min-w-0">
                  <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                      style={{
                        width: `${(currentTime / (duration_ || 1)) * 100}%`,
                      }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(currentTime / (duration_ || 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.1 }}
                    />
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
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
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
        </AnimatePresence>
      </div>
    );
  }
);

WaveformPlayer.displayName = "WaveformPlayer";

export default WaveformPlayer;
