"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Upload,
  Music,
  X,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatFileSize, isValidAudioFormat, isValidFileSize } from "@/lib/aws";

interface MixUploadProps {
  onUploadComplete?: (mix: any) => void;
  onClose?: () => void;
}

interface MixDetails {
  title: string;
  description: string;
  genre: string;
  tags: string;
  isPublic: boolean;
}

export default function MixUpload({
  onUploadComplete,
  onClose,
}: MixUploadProps) {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [mixDetails, setMixDetails] = useState<MixDetails>({
    title: "",
    description: "",
    genre: "",
    tags: "",
    isPublic: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (file: File) => {
    if (!isValidAudioFormat(file.type)) {
      toast.error(
        "Invalid audio format. Supported formats: MP3, WAV, OGG, M4A, AAC"
      );
      return;
    }

    if (!isValidFileSize(file.size)) {
      toast.error("File too large. Maximum size is 200MB");
      return;
    }

    setSelectedFile(file);
    if (!mixDetails.title) {
      setMixDetails((prev) => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const startUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", mixDetails.title);
      formData.append("description", mixDetails.description);
      formData.append("genre", mixDetails.genre);
      formData.append("tags", mixDetails.tags);
      formData.append("isPublic", mixDetails.isPublic.toString());

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to server
      const response = await fetch("/api/mixes/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { mix } = await response.json();

      setUploadProgress(100);
      toast.success("Mix uploaded successfully!");

      onUploadComplete?.(mix);
      setSelectedFile(null);
      setMixDetails({
        title: "",
        description: "",
        genre: "",
        tags: "",
        isPublic: false,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!session?.user || session.user.role !== "DJ") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-400 mb-4">Only DJs can upload mixes.</p>
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Upload Mix</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* File Selection */}
        <div className="mb-6">
          <div
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              selectedFile
                ? "border-green-500 bg-green-500/10"
                : "border-gray-600 hover:border-gray-500"
            }`}
          >
            {selectedFile ? (
              <div>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {selectedFile.name}
                </h3>
                <p className="text-gray-400 mb-4">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Drop your audio file here
                </h3>
                <p className="text-gray-400 mb-4">
                  or click to browse (MP3, WAV, OGG, M4A, AAC up to 200MB)
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Choose File
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-gray-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mix Details Form */}
        {selectedFile && !isUploading && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={mixDetails.title}
                onChange={(e) =>
                  setMixDetails((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500"
                placeholder="Enter mix title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
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
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500"
                rows={3}
                placeholder="Describe your mix..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <input
                  type="text"
                  value={mixDetails.genre}
                  onChange={(e) =>
                    setMixDetails((prev) => ({
                      ...prev,
                      genre: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500"
                  placeholder="e.g., House, Hip-Hop, Techno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  value={mixDetails.tags}
                  onChange={(e) =>
                    setMixDetails((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500"
                  placeholder="e.g., afrobeats, amapiano, hip-hop"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={mixDetails.isPublic}
                onChange={(e) =>
                  setMixDetails((prev) => ({
                    ...prev,
                    isPublic: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-violet-600 bg-gray-800 border-gray-600 rounded focus:ring-violet-500"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm">
                Make this mix public
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={startUpload}
            disabled={!selectedFile || isUploading}
            className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Music className="w-4 h-4" />
                <span>Upload Mix</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
