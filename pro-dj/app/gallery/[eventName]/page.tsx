"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Calendar,
  MapPin,
  Camera,
  Users,
  ArrowLeft,
  Star,
  Tag,
  Trash2,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";

interface EventPhoto {
  id: string;
  title: string;
  description: string | null;
  url: string;
  altText: string | null;
  tags: string[];
  isFeatured: boolean;
  dj: {
    stageName: string;
    profileImage: string | null;
    userId: string;
  };
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

export default function EventGalleryPage() {
  const { data: session } = useSession();
  const params = useParams();
  const eventName = decodeURIComponent(params.eventName as string);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchEventPhotos();
  }, [eventName]);

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

  const fetchEventPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gallery");
      const data = await response.json();

      if (data.ok) {
        const foundEvent = data.events.find(
          (e: Event) => e.eventName === eventName
        );
        if (foundEvent) {
          setEvent(foundEvent);
        } else {
          setError("Event not found");
        }
      } else {
        setError(data.error || "Failed to fetch event");
      }
    } catch (err) {
      setError("Failed to load event gallery");
      console.error("Error fetching event:", err);
    } finally {
      setLoading(false);
    }
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

  const deletePhoto = async (photoId: string) => {
    try {
      setDeletingPhoto(photoId);
      const response = await fetch(`/api/gallery/photos/${photoId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.ok) {
        toast.success("Photo deleted successfully");
        // Refresh the event data
        await fetchEventPhotos();
      } else {
        toast.error(data.error || "Failed to delete photo");
      }
    } catch (err) {
      toast.error("Failed to delete photo");
      console.error("Error deleting photo:", err);
    } finally {
      setDeletingPhoto(null);
      setShowDeleteModal(null);
    }
  };

  const canDeletePhoto = (photo: EventPhoto) => {
    if (!session?.user) return false;
    if (session.user.role === "ADMIN") return true;
    if (session.user.role === "DJ") {
      return photo.dj.userId === session.user.id;
    }
    return false;
  };

  const canDeleteEvent = (event: Event) => {
    if (!session?.user) return false;
    if (session.user.role === "ADMIN") return true;
    if (session.user.role === "DJ") {
      // Check if the DJ owns all photos in this event
      return event.photos.every((photo) => photo.dj.userId === session.user.id);
    }
    return false;
  };

  const deleteEvent = async () => {
    try {
      setDeletingPhoto("event");
      const response = await fetch(
        `/api/gallery/events/${encodeURIComponent(eventName)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.ok) {
        toast.success(data.message);
        // Redirect back to gallery
        window.location.href = "/gallery";
      } else {
        toast.error(data.error || "Failed to delete event");
      }
    } catch (err) {
      toast.error("Failed to delete event");
      console.error("Error deleting event:", err);
    } finally {
      setDeletingPhoto(null);
      setShowDeleteModal(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading event gallery...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || "Event not found"}</p>
            <Link
              href="/gallery"
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-violet-900/20 to-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/gallery"
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Gallery
            </Link>

            {/* Delete Event Button */}
            {event && canDeleteEvent(event) && (
              <button
                onClick={() => setShowDeleteModal("event")}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                title="Delete Entire Event"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </button>
            )}
          </div>

          {/* Event Info */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {event.eventName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-300">
              {/* Event Type */}
              {event.eventType && (
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(
                    event.eventType
                  )}`}
                >
                  {event.eventType}
                </div>
              )}

              {/* Date */}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(event.eventDate)}
              </div>

              {/* Venue/Location */}
              {(event.venue || event.location) && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.venue && event.location
                    ? `${event.venue}, ${event.location}`
                    : event.venue || event.location}
                </div>
              )}

              {/* Photo Count */}
              <div className="flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                {event.photos.length}{" "}
                {event.photos.length === 1 ? "photo" : "photos"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {event.photos.map((photo) => (
            <div
              key={photo.id}
              className="group cursor-pointer relative"
              onClick={() => setSelectedPhoto(photo)}
            >
              {/* Options Menu */}
              {canDeletePhoto(photo) && (
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(showMenu === photo.id ? null : photo.id);
                    }}
                    className="bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full p-2 text-white transition-colors"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu === photo.id && (
                    <div className="absolute right-0 top-10 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[140px]">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowMenu(null);
                          setShowDeleteModal(photo.id);
                        }}
                        className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Photo
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-800 hover:border-violet-500/50 transition-all duration-300">
                <Image
                  src={photo.url}
                  alt={photo.altText || photo.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />

                {/* Featured Badge */}
                {photo.isFeatured && (
                  <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                    <Star className="w-3 h-3 inline mr-1" />
                    Featured
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-end">
                  <div className="p-4 w-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-semibold mb-1">
                      {photo.title}
                    </h3>
                    {photo.description && (
                      <p className="text-gray-300 text-sm mb-2">
                        {photo.description}
                      </p>
                    )}

                    {/* DJ Info */}
                    <div className="flex items-center">
                      {photo.dj.profileImage ? (
                        <div className="relative w-6 h-6 mr-2">
                          <Image
                            src={photo.dj.profileImage}
                            alt={photo.dj.stageName}
                            fill
                            className="rounded-full object-cover"
                            sizes="24px"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                          <Users className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <span className="text-white text-sm">
                        {photo.dj.stageName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              ✕
            </button>

            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="relative w-full h-auto max-h-[70vh]">
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.altText || selectedPhoto.title}
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-[70vh] object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {selectedPhoto.title}
                    </h3>
                    {selectedPhoto.description && (
                      <p className="text-gray-300 mb-3">
                        {selectedPhoto.description}
                      </p>
                    )}
                  </div>

                  {selectedPhoto.isFeatured && (
                    <div className="bg-violet-600/20 text-violet-300 px-3 py-1 rounded-full text-sm font-medium border border-violet-500/30">
                      <Star className="w-4 h-4 inline mr-1" />
                      Featured
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedPhoto.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Tag className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-400">Tags:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* DJ Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {selectedPhoto.dj.profileImage ? (
                      <div className="relative w-10 h-10 mr-3">
                        <Image
                          src={selectedPhoto.dj.profileImage}
                          alt={selectedPhoto.dj.stageName}
                          fill
                          className="rounded-full object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {selectedPhoto.dj.stageName}
                      </p>
                      <p className="text-gray-400 text-sm">DJ</p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm">
                    {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-white">
                {showDeleteModal === "event" ? "Delete Event" : "Delete Photo"}
              </h3>
            </div>

            {showDeleteModal === "event" ? (
              <>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete <strong>"{eventName}"</strong>
                  ? This will permanently delete the entire event and all its
                  associated photos.
                </p>

                <p className="text-red-400 text-sm mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  ⚠️ This action cannot be undone. All {event?.photos.length}{" "}
                  photos for this event will be permanently deleted.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete this photo? This action cannot
                  be undone.
                </p>

                <p className="text-red-400 text-sm mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  ⚠️ This photo will be permanently deleted from the gallery.
                </p>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={deletingPhoto === showDeleteModal}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteModal === "event") {
                    deleteEvent();
                  } else {
                    deletePhoto(showDeleteModal);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                disabled={deletingPhoto === showDeleteModal}
              >
                {deletingPhoto === showDeleteModal ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {showDeleteModal === "event"
                      ? "Delete Event"
                      : "Delete Photo"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
