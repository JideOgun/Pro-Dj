"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AuthGuard from "@/components/AuthGuard";
import {
  Calendar,
  MapPin,
  Camera,
  Users,
  ArrowRight,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Upload,
  Plus,
  Image as ImageIcon,
  Tag,
  Star,
  Edit,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Music,
  Award,
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
  profileImage: string | null;
  userProfileImage: string | null;
  userId: string;
  events: Event[];
}

export default function GalleryPage() {
  const { data: session } = useSession();
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Sliding gallery state
  const [currentSlide, setCurrentSlide] = useState<{ [djId: string]: number }>(
    {}
  );
  const scrollContainerRefs = useRef<{ [djId: string]: HTMLDivElement | null }>(
    {}
  );

  // Upload functionality
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [photoLimit] = useState(50);

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

  useEffect(() => {
    fetchGallery();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        // Add a small delay to prevent immediate closing
        setTimeout(() => {
          setShowMenu(null);
        }, 100);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/gallery");
      const data = await response.json();

      if (data.ok) {
        setDjs(data.djs);
        setTotalPhotos(data.pagination.total);
      } else {
        setError(data.error || "Failed to fetch gallery");
      }
    } catch (error) {
      console.error("Error fetching gallery:", error);
      setError("Failed to fetch gallery");
    } finally {
      setLoading(false);
    }
  };

  // Sliding gallery functions
  const scrollToEvent = (djId: string, direction: "left" | "right") => {
    const container = scrollContainerRefs.current[djId];
    if (!container) return;

    const cardWidth = 320; // Approximate card width including gap
    const currentScroll = currentSlide[djId] || 0;
    const maxScroll = Math.max(
      0,
      djs.find((dj) => dj.djId === djId)?.events.length || 0 - 3
    );

    let newScroll;
    if (direction === "left") {
      newScroll = Math.max(0, currentScroll - 1);
    } else {
      newScroll = Math.min(maxScroll, currentScroll + 1);
    }

    setCurrentSlide((prev) => ({ ...prev, [djId]: newScroll }));
    container.scrollTo({
      left: newScroll * cardWidth,
      behavior: "smooth",
    });
  };

  const canScrollLeft = (djId: string) => {
    return (currentSlide[djId] || 0) > 0;
  };

  const canScrollRight = (djId: string) => {
    const dj = djs.find((d) => d.djId === djId);
    if (!dj) return false;
    // Show right arrow if there are more events than can fit in the visible area
    // Assuming 3 events fit in the visible area
    const visibleEvents = 3;
    const hasMoreEvents = dj.events.length > visibleEvents;
    const currentPosition = currentSlide[djId] || 0;
    const maxScroll = Math.max(0, dj.events.length - visibleEvents);

    console.log(
      `DJ ${dj.stageName}: events=${
        dj.events.length
      }, current=${currentPosition}, maxScroll=${maxScroll}, hasMore=${hasMoreEvents}, canScroll=${
        currentPosition < maxScroll
      }`
    );

    return hasMoreEvents && currentPosition < maxScroll;
  };

  const deleteEvent = async (eventName: string) => {
    try {
      setDeletingEvent(eventName);
      const response = await fetch(
        `/api/gallery/events/${encodeURIComponent(eventName)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.ok) {
        toast.success(data.message);
        // Refresh the events list
        await fetchGallery();
      } else {
        toast.error(data.error || "Failed to delete event");
      }
    } catch (err) {
      toast.error("Failed to delete event");
      console.error("Error deleting event:", err);
    } finally {
      setDeletingEvent(null);
      setShowDeleteModal(null);
    }
  };

  const canDeleteEvent = (event: Event, djUserId: string) => {
    if (!session?.user) return false;
    if (session.user.role === "ADMIN") return true;
    return djUserId === session.user.id;
  };

  // Upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    const remainingSlots = photoLimit - totalPhotos;
    if (files.length > remainingSlots) {
      toast.error(
        `You can only upload ${remainingSlots} more photos (limit: ${photoLimit} total photos)`
      );
      return;
    }

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
        errors.push(`${file.name}: Not a valid image file`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast.error(`Some files were rejected:\n${errors.join("\n")}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({});
    setUploadingFiles([]);

    const uploadedPhotos: any[] = [];
    const errors: string[] = [];

    // Upload files one by one to show progress
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileId = `${file.name}-${i}`;

      setUploadingFiles((prev) => [...prev, fileId]);
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "title",
          uploadForm.title || file.name.replace(/\.[^/.]+$/, "")
        );
        formData.append("description", uploadForm.description);
        formData.append("eventName", uploadForm.eventName);
        formData.append("eventDate", uploadForm.eventDate);
        formData.append("eventType", uploadForm.eventType);
        formData.append("venue", uploadForm.venue);
        formData.append("location", uploadForm.location);
        formData.append("tags", uploadForm.tags);
        formData.append("isFeatured", uploadForm.isFeatured.toString());

        const response = await fetch("/api/dj/event-photos", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.ok) {
          uploadedPhotos.push(result.data);
          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
        } else {
          errors.push(`${file.name}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        errors.push(`${file.name}: Upload failed`);
      } finally {
        setUploadingFiles((prev) => prev.filter((id) => id !== fileId));
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
      // Refresh the events list
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

  const formatDate = (date: Date | null) => {
    if (!date) return "Date not specified";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEventTypeColor = (eventType: string | null) => {
    switch (eventType?.toLowerCase()) {
      case "wedding":
        return "bg-pink-500/20 text-pink-300 border-pink-500/30";
      case "club":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "birthday":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "corporate":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "party":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
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
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
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
                    onClick={() => setShowUploadModal(true)}
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
                Start by uploading some event photos to showcase your work.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Photos
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {djs.map((dj) => (
                <div
                  key={dj.djId}
                  className="bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800"
                >
                  {/* DJ Header */}
                  <div className="p-3 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                      {/* DJ Profile Picture */}
                      {dj.profileImage ? (
                        <div className="relative w-10 h-10">
                          <Image
                            src={dj.profileImage}
                            alt={dj.stageName}
                            fill
                            className="rounded-full object-cover border-2 border-violet-500/30"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center border-2 border-violet-500/30">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                      )}

                      {/* DJ Information */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h2 className="text-lg font-bold text-white">
                            {dj.stageName}
                          </h2>
                          <div className="flex items-center space-x-1 text-violet-400">
                            <Award className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              Professional DJ
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-gray-400 text-xs">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {dj.events.length}{" "}
                              {dj.events.length === 1 ? "Event" : "Events"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Camera className="w-3 h-3" />
                            <span>
                              {dj.events.reduce(
                                (total, event) => total + event.photos.length,
                                0
                              )}{" "}
                              Photos
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>
                              {dj.events.reduce(
                                (total, event) =>
                                  total +
                                  event.photos.filter((p) => p.isFeatured)
                                    .length,
                                0
                              )}{" "}
                              Featured
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Profile Button */}
                      <Link
                        href={`/dj/profile/${dj.djId}`}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg transition-colors inline-flex items-center text-xs font-medium"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Profile
                      </Link>
                    </div>
                  </div>

                  {/* Events Sliding Gallery */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Recent Events
                      </h3>
                    </div>

                    {/* Scrollable Events Container with End Arrows */}
                    <div className="relative group">
                      {/* Left Arrow - Positioned at start */}
                      <button
                        onClick={() => scrollToEvent(dj.djId, "left")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/80 hover:bg-black/90 backdrop-blur-sm text-white shadow-lg transition-all duration-300 hover:scale-110"
                        style={{ opacity: canScrollLeft(dj.djId) ? 1 : 0.3 }}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      {/* Right Arrow - Positioned at end */}
                      <button
                        onClick={() => scrollToEvent(dj.djId, "right")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/80 hover:bg-black/90 backdrop-blur-sm text-white shadow-lg transition-all duration-300 hover:scale-110"
                        style={{ opacity: canScrollRight(dj.djId) ? 1 : 0.3 }}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      <div
                        ref={(el) =>
                          (scrollContainerRefs.current[dj.djId] = el)
                        }
                        className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4 px-2"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {dj.events.map((event) => {
                          // Get the first photo as the cover image
                          const coverPhoto = event.photos[0];
                          const photoCount = event.photos.length;

                          return (
                            <div
                              key={event.eventName}
                              className="group bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 relative flex-shrink-0"
                              style={{ width: "300px" }}
                            >
                              {/* Options Menu */}
                              {canDeleteEvent(event, dj.userId) && (
                                <div className="absolute top-4 right-4 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setShowMenu(
                                        showMenu === event.eventName
                                          ? null
                                          : event.eventName
                                      );
                                    }}
                                    className="bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full p-2 text-white transition-colors"
                                    title="More options"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {showMenu === event.eventName && (
                                    <div className="absolute right-0 top-10 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[140px]">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setShowMenu(null);
                                          setShowDeleteModal(event.eventName);
                                        }}
                                        className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors text-sm"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Event
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              <Link
                                href={`/gallery/${encodeURIComponent(
                                  event.eventName
                                )}`}
                                className="block"
                              >
                                {/* Cover Image */}
                                <div className="relative aspect-[4/3] overflow-hidden">
                                  <Image
                                    src={coverPhoto.url}
                                    alt={coverPhoto.altText || event.eventName}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="300px"
                                  />

                                  {/* Photo Count Badge */}
                                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                                    <Camera className="w-4 h-4 inline mr-1" />
                                    {photoCount}{" "}
                                    {photoCount === 1 ? "photo" : "photos"}
                                  </div>

                                  {/* Featured Badge */}
                                  {coverPhoto.isFeatured && (
                                    <div className="absolute top-4 left-4 bg-violet-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                                      ⭐ Featured
                                    </div>
                                  )}
                                </div>

                                {/* Event Info */}
                                <div className="p-4">
                                  <h3 className="text-lg font-bold mb-2 group-hover:text-violet-300 transition-colors">
                                    {event.eventName}
                                  </h3>

                                  <div className="space-y-2 mb-3">
                                    {/* Event Type */}
                                    {event.eventType && (
                                      <div
                                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(
                                          event.eventType
                                        )}`}
                                      >
                                        {event.eventType}
                                      </div>
                                    )}

                                    {/* Date */}
                                    <div className="flex items-center text-gray-400 text-sm">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      {formatDate(event.eventDate)}
                                    </div>

                                    {/* Venue/Location */}
                                    {(event.venue || event.location) && (
                                      <div className="flex items-center text-gray-400 text-sm">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {event.venue && event.location
                                          ? `${event.venue}, ${event.location}`
                                          : event.venue || event.location}
                                      </div>
                                    )}
                                  </div>

                                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-xl font-bold text-white">Delete Event</h3>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to delete{" "}
                <strong>"{showDeleteModal}"</strong>? This will permanently
                delete the entire event and all its associated photos.
              </p>

              <p className="text-red-400 text-sm mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                ⚠️ This action cannot be undone. All photos for this event will
                be permanently deleted.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  disabled={deletingEvent === showDeleteModal}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteEvent(showDeleteModal)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  disabled={deletingEvent === showDeleteModal}
                >
                  {deletingEvent === showDeleteModal ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Event
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Upload Event Photos
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
                        Max 10MB per file, up to {photoLimit - totalPhotos}{" "}
                        photos
                      </span>
                    </label>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-300 mb-2">
                        Selected {selectedFiles.length} file(s):
                      </p>
                      <div className="space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-800 rounded px-3 py-2"
                          >
                            <span className="text-sm text-gray-300">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(file.size / (1024 * 1024)).toFixed(1)}MB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Details Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Event Name *
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
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                      placeholder="e.g., Summer Wedding 2024"
                      required
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
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Event Type
                    </label>
                    <select
                      value={uploadForm.eventType}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          eventType: e.target.value,
                        })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                    >
                      <option value="">Select event type</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Birthday">Birthday</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Club">Club</option>
                      <option value="Party">Party</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={uploadForm.venue}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, venue: e.target.value })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                      placeholder="e.g., Grand Hotel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={uploadForm.location}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          location: e.target.value,
                        })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                      placeholder="e.g., Austin, TX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, tags: e.target.value })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                      placeholder="e.g., wedding, outdoor, sunset"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title (optional - will use filename if empty)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, title: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                    placeholder="Photo title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                    rows={3}
                    placeholder="Photo description"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={uploadForm.isFeatured}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        isFeatured: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-violet-600 bg-gray-800 border-gray-700 rounded focus:ring-violet-500"
                  />
                  <label
                    htmlFor="isFeatured"
                    className="ml-2 text-sm text-gray-300"
                  >
                    Mark as featured photo
                  </label>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">Uploading photos...</p>
                    {Object.entries(uploadProgress).map(
                      ([fileId, progress]) => (
                        <div key={fileId} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{fileId}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
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
    </AuthGuard>
  );
}
