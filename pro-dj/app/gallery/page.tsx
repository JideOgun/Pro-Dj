"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Camera,
  ArrowRight,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Upload,
  Star,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Music,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { GalleryEventCounter } from "@/components/GalleryEventCounter";
import { GallerySubscriptionPrompt } from "@/components/GallerySubscriptionPrompt";

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

function GalleryPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

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

  const fetchGallery = async () => {
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
      console.error("Error fetching gallery:", error);
      setError("Failed to fetch gallery");
    } finally {
      setLoading(false);
    }
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
              <div className="mt-8 flex items-center gap-3">
                <GalleryEventCounter />
                <button
                  onClick={() =>
                    toast.success("Upload functionality coming soon")
                  }
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
            {canUpload() && (
              <button
                onClick={() =>
                  toast.success("Upload functionality coming soon")
                }
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Photos
              </button>
            )}
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
                    {dj.userProfileImage ? (
                      <div className="relative w-10 h-10">
                        <Image
                          src={dj.userProfileImage}
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
                                event.photos.filter((p) => p.isFeatured).length,
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

                {/* Events Grid */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Recent Events
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dj.events.map((event) => {
                      // Get the first photo as the cover image
                      const coverPhoto = event.photos[0];
                      const photoCount = event.photos.length;

                      return (
                        <div
                          key={event.eventName}
                          className="group bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 relative"
                        >
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GalleryPageContent />
    </Suspense>
  );
}
