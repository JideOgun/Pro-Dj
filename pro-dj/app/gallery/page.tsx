"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import {
  Calendar,
  MapPin,
  Camera,
  ArrowRight,
  Upload,
  X,
  Star,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

interface EventPhoto {
  id: string;
  title: string;
  description: string | null;
  url: string;
  altText: string | null;
  tags: string[];
  isFeatured: boolean;
  createdAt: Date;
}

interface Event {
  eventName: string;
  eventDate: Date | null;
  eventType: string | null;
  venue: string | null;
  location: string | null;
  photos: EventPhoto[];
}

interface DJ {
  djId: string;
  stageName: string;
  events: Event[];
}

function GalleryContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload functionality
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    eventName: "",
    eventDate: "",
    eventType: "",
    venue: "",
    location: "",
    tags: "",
    isFeatured: false,
  });

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const djId = searchParams.get("djId");
      const url = djId ? `/api/gallery?djId=${djId}` : "/api/gallery";
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setDjs(data.djs);
      } else {
        setError(data.error || "Failed to fetch gallery");
      }
    } catch (error) {
      setError("Failed to fetch gallery");
      console.error("Gallery fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate each file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        errors.push(
          `${file.name}: File size (${fileSizeMB}MB) exceeds 10MB limit`
        );
      } else if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: Only image files are allowed`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast.error(`${errors.length} file(s) rejected: ${errors.join(", ")}`);
    }

    setSelectedFiles(validFiles);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    const uploadedPhotos: Array<{ id: string; title: string; url: string }> =
      [];
    const errors: string[] = [];

    // Upload files one by one
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", uploadForm.title || file.name);
        formData.append("description", uploadForm.description || "");
        formData.append("eventName", uploadForm.eventName || "");
        formData.append("eventDate", uploadForm.eventDate || "");
        formData.append("eventType", uploadForm.eventType || "");
        formData.append("venue", uploadForm.venue || "");
        formData.append("location", uploadForm.location || "");
        formData.append("tags", uploadForm.tags || "");
        formData.append("isFeatured", uploadForm.isFeatured.toString());

        const response = await fetch("/api/dj/event-photos", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.ok) {
          uploadedPhotos.push(result.data);
        } else {
          errors.push(`${file.name}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        errors.push(`${file.name}: Upload failed`);
      }
    }

    // Show results
    if (uploadedPhotos.length > 0 && errors.length === 0) {
      toast.success(
        `Successfully uploaded ${uploadedPhotos.length} photo${
          uploadedPhotos.length === 1 ? "" : "s"
        }`
      );
      setShowUploadModal(false);
      setSelectedFiles([]);
      setUploadForm({
        title: "",
        description: "",
        eventName: "",
        eventDate: "",
        eventType: "",
        venue: "",
        location: "",
        tags: "",
        isFeatured: false,
      });
      await fetchGallery();
    } else if (uploadedPhotos.length > 0 && errors.length > 0) {
      toast.success(
        `Uploaded ${uploadedPhotos.length} photo${
          uploadedPhotos.length === 1 ? "" : "s"
        }, but ${errors.length} failed`
      );
    } else if (errors.length > 0) {
      toast.error(`Upload failed: ${errors.join(", ")}`);
    }

    setUploading(false);
  };

  const canUpload = () => {
    return session?.user?.role === "DJ" || session?.user?.role === "ADMIN";
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading gallery..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchGallery}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-violet-900/20 to-black">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Event Gallery
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Explore amazing moments from our DJ performances across various
              events
            </p>

            {/* Upload Button */}
            {canUpload() && (
              <div className="mt-8">
                <button
                  onClick={handleUploadClick}
                  className="inline-flex items-center bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Photos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {djs.length === 0 ? (
          <div className="text-center py-16">
            <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Photos Yet
            </h3>
            <p className="text-gray-500 mb-6">
              {canUpload()
                ? "Start by uploading some event photos to showcase your work."
                : "No photos have been uploaded yet. Check back soon for amazing event galleries!"}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {djs.map((dj) => (
              <div key={dj.djId} className="space-y-6">
                {/* DJ Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-violet-400">
                      {dj.stageName}
                    </div>
                    <div className="flex items-center space-x-4 text-gray-400 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {dj.events.length}{" "}
                          {dj.events.length === 1 ? "Event" : "Events"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/dj/profile/${dj.djId}`}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg transition-colors inline-flex items-center text-xs font-medium"
                  >
                    View Profile
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>

                {/* Events Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dj.events.map((event) => {
                    // Get the first photo as cover and count total photos
                    const coverPhoto = event.photos[0];
                    const photoCount = event.photos.length;
                    const featuredCount = event.photos.filter(
                      (p) => p.isFeatured
                    ).length;

                    return (
                      <Link
                        key={event.eventName}
                        href={`/gallery/${encodeURIComponent(event.eventName)}`}
                        className="block bg-gray-900/30 rounded-xl overflow-hidden border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 group"
                      >
                        {/* Event Cover Image */}
                        <div className="relative aspect-video bg-gray-800">
                          {coverPhoto ? (
                            <Image
                              src={coverPhoto.url}
                              alt={coverPhoto.altText || coverPhoto.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Camera className="w-12 h-12 text-gray-600" />
                            </div>
                          )}

                          {/* Photo Count Overlay */}
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium">
                            {photoCount} photo{photoCount !== 1 ? "s" : ""}
                          </div>

                          {/* Featured Badge */}
                          {featuredCount > 0 && (
                            <div className="absolute top-3 left-3 bg-yellow-500/90 backdrop-blur-sm text-black px-2 py-1 rounded-lg text-xs font-medium flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              {featuredCount} featured
                            </div>
                          )}
                        </div>

                        {/* Event Info */}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors">
                            {event.eventName}
                          </h3>

                          <div className="space-y-2 text-sm text-gray-400">
                            {event.eventDate && (
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(event.eventDate).toLocaleDateString()}
                              </div>
                            )}
                            {(event.venue || event.location) && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                {event.venue && event.location
                                  ? `${event.venue}, ${event.location}`
                                  : event.venue || event.location}
                              </div>
                            )}
                            {event.eventType && (
                              <div className="flex items-center">
                                <Tag className="w-4 h-4 mr-2" />
                                {event.eventType}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Add Photos to Gallery
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Upload Form */}
            <div className="space-y-6">
              {/* File Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Photos
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-violet-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-300">
                      Click to select photos or drag and drop
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      Max 10MB per file
                    </span>
                  </label>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-300 mb-2">
                      Selected: {selectedFiles.length} file(s)
                    </p>
                    <div className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-400 flex justify-between"
                        >
                          <span>{file.name}</span>
                          <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={uploadForm.eventName}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        eventName: e.target.value,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Enter event name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={uploadForm.eventDate}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        eventDate: e.target.value,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={selectedFiles.length === 0 || uploading}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {selectedFiles.length} Photo
                      {selectedFiles.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading gallery..." />}>
      <GalleryContent />
    </Suspense>
  );
}
