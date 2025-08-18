"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Music,
  FileAudio,
  Image as ImageIcon,
  Tag,
  Globe,
  Lock,
  Check,
  AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface MixUploadProps {
  onClose: () => void;
  onUploadComplete?: (mix: any) => void;
}

interface MixDetails {
  title: string;
  description: string;
  genres: string[];
  tags: string;
  isPublic: boolean;
}

const GENRES = [
  "Afrobeats",
  "Amapiano",
  "Hip-Hop",
  "House",
  "Techno",
  "Trance",
  "Dubstep",
  "Drum & Bass",
  "Jazz",
  "Soul",
  "R&B",
  "Pop",
  "Rock",
  "Electronic",
  "Reggae",
  "Dancehall",
  "Trap",
  "Future Bass",
  "Progressive House",
  "Deep House",
];

export default function MixUpload({
  onClose,
  onUploadComplete,
}: MixUploadProps) {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [albumArt, setAlbumArt] = useState<File | null>(null);
  const [mixDetails, setMixDetails] = useState<MixDetails>({
    title: "",
    description: "",
    genres: [],
    tags: "",
    isPublic: true,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [albumDragActive, setAlbumDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const albumArtInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback(
    (e: React.DragEvent, setDragState: (active: boolean) => void) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragState(true);
      } else if (e.type === "dragleave") {
        setDragState(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (
      e: React.DragEvent,
      setFile: (file: File) => void,
      setDragState: (active: boolean) => void
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        setFile(file);
      }
    },
    []
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith("audio/")) {
        toast.error("Please select a valid audio file");
        return;
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleAlbumArtSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setAlbumArt(file);
    }
  };

  const startUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a mix file");
      return;
    }

    if (!mixDetails.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (mixDetails.genres.length === 0) {
      toast.error("Please select at least one genre");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", mixDetails.title);
      formData.append("description", mixDetails.description);
      formData.append("genre", mixDetails.genres.join(","));
      formData.append("tags", mixDetails.tags);
      formData.append("isPublic", mixDetails.isPublic.toString());

      if (albumArt) {
        formData.append("albumArt", albumArt);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch("/api/mixes/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        toast.success("Mix uploaded successfully!", {
          icon: "🎵",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });

        if (onUploadComplete && data.mix) {
          onUploadComplete(data.mix);
        }

        onClose();
      } else {
        if (response.status === 409) {
          toast.error("This mix has already been uploaded", {
            icon: "⚠️",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        } else if (response.status === 413) {
          toast.error("File too large. Please choose a smaller file.", {
            icon: "📁",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        } else if (response.status === 400) {
          toast.error(data.error || "Invalid file format", {
            icon: "❌",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        } else {
          toast.error(data.error || "Upload failed", {
            icon: "❌",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.", {
        icon: "❌",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-semibold text-white"
            >
              Upload Mix
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              disabled={isUploading}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800 disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Upload Progress */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full"
                  />
                  <span className="text-white font-medium">
                    Uploading mix...
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="text-right text-sm text-gray-400 mt-1">
                  {Math.round(uploadProgress)}%
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-white mb-3">
                Mix File *
              </label>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onDragEnter={(e) => handleDrag(e, setDragActive)}
                onDragLeave={(e) => handleDrag(e, setDragActive)}
                onDragOver={(e) => handleDrag(e, setDragActive)}
                onDrop={(e) => handleDrop(e, setSelectedFile, setDragActive)}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                  dragActive
                    ? "border-violet-500 bg-violet-500/10"
                    : selectedFile
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <AnimatePresence mode="wait">
                  {selectedFile ? (
                    <motion.div
                      key="file-selected"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center space-x-3"
                    >
                      <Check className="w-8 h-8 text-green-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file-upload"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <FileAudio className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-white font-medium mb-1">
                        Drop your mix file here or click to browse
                      </p>
                      <p className="text-gray-400 text-sm">
                        Supports MP3, WAV, FLAC (Max 100MB)
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Album Art Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-white mb-3">
                Album Art (Optional)
              </label>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onDragEnter={(e) => handleDrag(e, setAlbumDragActive)}
                onDragLeave={(e) => handleDrag(e, setAlbumDragActive)}
                onDragOver={(e) => handleDrag(e, setAlbumDragActive)}
                onDrop={(e) => handleDrop(e, setAlbumArt, setAlbumDragActive)}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                  albumDragActive
                    ? "border-violet-500 bg-violet-500/10"
                    : albumArt
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                onClick={() => albumArtInputRef.current?.click()}
              >
                <input
                  ref={albumArtInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAlbumArtSelect}
                  className="hidden"
                />
                <AnimatePresence mode="wait">
                  {albumArt ? (
                    <motion.div
                      key="album-selected"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center space-x-3"
                    >
                      <Check className="w-8 h-8 text-green-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">
                          {albumArt.name}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {formatFileSize(albumArt.size)}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="album-upload"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-white font-medium mb-1">
                        Drop album art here or click to browse
                      </p>
                      <p className="text-gray-400 text-sm">
                        Supports JPG, PNG, GIF (Max 5MB)
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Mix Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={mixDetails.title}
                  onChange={(e) =>
                    setMixDetails((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  placeholder="Enter mix title..."
                  maxLength={100}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {mixDetails.title.length}/100
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={mixDetails.description}
                  onChange={(e) =>
                    setMixDetails((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                  placeholder="Describe your mix..."
                  rows={3}
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {mixDetails.description.length}/500
                </div>
              </div>

              {/* Genre Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Genres *
                </label>
                <div className="min-h-[42px] bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus-within:border-violet-500 transition-all">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <AnimatePresence>
                      {mixDetails.genres.map((genre) => (
                        <motion.span
                          key={genre}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center px-2 py-1 bg-violet-600 text-white text-xs rounded-md"
                        >
                          {genre}
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                            type="button"
                            onClick={() =>
                              setMixDetails((prev) => ({
                                ...prev,
                                genres: prev.genres.filter((g) => g !== genre),
                              }))
                            }
                            className="ml-1 hover:bg-violet-700 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </motion.button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (
                        e.target.value &&
                        !mixDetails.genres.includes(e.target.value)
                      ) {
                        setMixDetails((prev) => ({
                          ...prev,
                          genres: [...prev.genres, e.target.value],
                        }));
                      }
                    }}
                    className="w-full bg-transparent border-none outline-none text-sm text-white"
                  >
                    <option value="">Add a genre...</option>
                    {GENRES.filter(
                      (genre) => !mixDetails.genres.includes(genre)
                    ).map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>
                {mixDetails.genres.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Select one or more genres
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tags
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={mixDetails.tags}
                    onChange={(e) =>
                      setMixDetails((prev) => ({
                        ...prev,
                        tags: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    placeholder="Enter tags separated by commas..."
                  />
                </div>
              </div>

              {/* Privacy Setting */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Privacy
                </label>
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setMixDetails((prev) => ({ ...prev, isPublic: true }))
                    }
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      mixDetails.isPublic
                        ? "bg-violet-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Public</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setMixDetails((prev) => ({ ...prev, isPublic: false }))
                    }
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      !mixDetails.isPublic
                        ? "bg-violet-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Private</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-end space-x-3 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                disabled={isUploading}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startUpload}
                disabled={
                  isUploading ||
                  !selectedFile ||
                  !mixDetails.title.trim() ||
                  mixDetails.genres.length === 0
                }
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {isUploading ? (
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
                  <Upload className="w-4 h-4" />
                )}
                <span>{isUploading ? "Uploading..." : "Upload Mix"}</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
