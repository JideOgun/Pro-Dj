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
} from "lucide-react";

interface WaveformPlayerProps {
  src: string | null;
  title: string;
  artist?: string;
  duration?: number;
  className?: string;
}

const WaveformPlayer: React.FC<WaveformPlayerProps> = React.memo(
  ({ src, title, artist, duration = 0, className = "" }) => {
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

    // Format time helper
    const formatTime = useCallback((seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }, []);

    // Initialize Web Audio API for real-time visualization
    const initializeAudioContext = useCallback(() => {
      if (!audioRef.current || audioContextRef.current) return;

      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;

        const source = audioContextRef.current.createMediaElementSource(
          audioRef.current
        );
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.warn("Web Audio API not supported or already connected:", err);
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
          console.log("Audio metadata loaded");
          setDuration(audioRef.current?.duration || 0);
          setIsLoading(false);
          setError(null);
          // Initialize audio context after metadata is loaded
          initializeAudioContext();
        });

        audioRef.current.addEventListener("play", () => {
          console.log("Audio play");
          setIsPlaying(true);
          // Resume audio context if suspended
          if (audioContextRef.current?.state === "suspended") {
            audioContextRef.current.resume();
          }
        });

        audioRef.current.addEventListener("pause", () => {
          console.log("Audio pause");
          setIsPlaying(false);
        });

        audioRef.current.addEventListener("ended", () => {
          console.log("Audio ended");
          setIsPlaying(false);
          setCurrentTime(0);
        });

        audioRef.current.addEventListener("timeupdate", () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
        });

        audioRef.current.addEventListener("error", (e) => {
          console.error("Audio error:", e);
          // Only set error if it's a real audio loading/playback error
          const target = e.target as HTMLAudioElement;
          if (target.error && target.error.code !== 0) {
            setIsLoading(false);
            setError("Failed to load audio");
          }
        });

        audioRef.current.addEventListener("loadstart", () => {
          console.log("Audio load start");
          setIsLoading(true);
          setError(null);
        });

        audioRef.current.addEventListener("canplay", () => {
          console.log("Audio can play");
          setIsLoading(false);
        });

        // Set initial volume
        audioRef.current.volume = volume;
      }

      // Cleanup
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };
    }, [initializeAudioContext]);

    // Load audio when src changes
    useEffect(() => {
      if (!audioRef.current || !src) return;

      console.log("Loading audio:", src);
      setIsLoading(true);
      setError(null);

      // Clean up previous object URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      // Use the streaming URL directly with the audio element
      audioRef.current.src = src;
      audioRef.current.load();
    }, [src]);

    // Generate simple waveform data
    useEffect(() => {
      if (!canvasRef.current || duration_ === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Only draw static waveform if not playing (real-time takes over when playing)
      if (isPlaying) return;

      // Generate random waveform data for visualization
      const bars = 100;
      const data = Array.from(
        { length: bars },
        () => Math.random() * 0.6 + 0.2
      );
      setWaveformData(data);

      // Draw static waveform
      const barWidth = canvas.width / bars;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, "rgba(139, 92, 246, 0.1)");
      bgGradient.addColorStop(1, "rgba(168, 85, 247, 0.05)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      data.forEach((height, index) => {
        const x = index * barWidth;
        const y = (canvas.height - height * canvas.height) / 2;
        const barHeight = height * canvas.height;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#8b5cf6");
        gradient.addColorStop(0.5, "#a855f7");
        gradient.addColorStop(1, "#7c3aed");

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);

        // Add subtle glow
        ctx.shadowColor = "#8b5cf6";
        ctx.shadowBlur = 4;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        ctx.shadowBlur = 0;
      });
    }, [duration_, isPlaying]);

    // Draw real-time waveform
    const drawWaveform = useCallback(() => {
      if (!canvasRef.current || !analyserRef.current || !isPlaying) return;

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Clear canvas with gradient background
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, "rgba(139, 92, 246, 0.1)");
        bgGradient.addColorStop(1, "rgba(168, 85, 247, 0.05)");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw waveform bars
        const barWidth = (canvas.width / bufferLength) * 2.5;
        const barGap = 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.8; // Scale down for better visual
          const y = (canvas.height - barHeight) / 2;

          if (barHeight > 2) {
            // Only draw if bar has meaningful height
            // Create gradient for each bar
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, "#8b5cf6"); // Violet
            gradient.addColorStop(0.5, "#a855f7"); // Purple
            gradient.addColorStop(1, "#7c3aed"); // Darker purple

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth - barGap, barHeight);

            // Add glow effect
            ctx.shadowColor = "#8b5cf6";
            ctx.shadowBlur = 8;
            ctx.fillRect(x, y, barWidth - barGap, barHeight);
            ctx.shadowBlur = 0;
          }

          x += barWidth;
        }

        // Continue animation
        animationFrameRef.current = requestAnimationFrame(drawWaveform);
      } catch (err) {
        console.warn("Error drawing waveform:", err);
        // Stop animation on error
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    }, [isPlaying]);

    // Start/stop waveform animation
    useEffect(() => {
      if (isPlaying && analyserRef.current) {
        drawWaveform();
      } else if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isPlaying, drawWaveform]);

    // Handle play/pause
    const togglePlay = useCallback(() => {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Expand when starting to play
        setIsExpanded(true);
        audioRef.current.play().catch((err) => {
          console.error("Error playing audio:", err);
          setError("Failed to play audio");
        });
      }
    }, [isPlaying]);

    // Handle seeking
    const handleSeek = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!audioRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration_;

        audioRef.current.currentTime = newTime;
      },
      [duration_]
    );

    // Handle volume change
    const handleVolumeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        if (audioRef.current) {
          audioRef.current.volume = newVolume;
        }
      },
      []
    );

    // Toggle mute
    const toggleMute = useCallback(() => {
      if (!audioRef.current) return;

      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }, [isMuted, volume]);

    // Skip forward/backward
    const skip = useCallback(
      (seconds: number) => {
        if (!audioRef.current) return;

        const newTime = Math.max(0, Math.min(duration_, currentTime + seconds));
        audioRef.current.currentTime = newTime;
      },
      [currentTime, duration_]
    );

    return (
      <div className={`${className}`}>
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Compact circular button
            <motion.button
              key="compact"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              disabled={isLoading}
              className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-md"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </motion.button>
          ) : (
            // Full expanded player
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 min-w-0">
                  <motion.h4
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-lg font-semibold text-white truncate"
                  >
                    {title}
                  </motion.h4>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm text-gray-400 truncate"
                  >
                    {artist}
                  </motion.p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-400 font-mono bg-gray-800/50 px-3 py-1 rounded-lg">
                    {formatTime(currentTime)} / {formatTime(duration_)}
                  </div>
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
                className="mb-6"
              >
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={60}
                  className="w-full cursor-pointer rounded-xl overflow-hidden bg-gray-900/30 border border-gray-700/30"
                  onClick={handleSeek}
                />
              </motion.div>

              {/* Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
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
                <div className="flex-1 mx-6">
                  <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
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
                <div className="flex items-center space-x-2">
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
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
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
