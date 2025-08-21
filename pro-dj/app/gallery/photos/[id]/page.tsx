"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import CommentSection from "@/components/CommentSection";
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Tag,
  Star,
  Eye,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface EventPhoto {
  id: string;
  title: string;
  description: string | null;
  url: string;
  altText: string | null;
  tags: string[];
  isFeatured: boolean;
  eventName: string | null;
  eventDate: Date | null;
  eventType: string | null;
  venue: string | null;
  location: string | null;
  createdAt: Date;
  dj: {
    stageName: string;
    userProfileImage: string | null;
    userId: string;
  };
}

export default function PhotoDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const photoId = params.id as string;

  const [photo, setPhoto] = useState<EventPhoto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (photoId) {
      fetchPhoto();
    }
  }, [photoId]);

  const fetchPhoto = async () => {
    try {
      const response = await fetch(`/api/gallery/photos/${photoId}`);
      const data = await response.json();

      if (data.ok) {
        setPhoto(data.photo);
      } else {
        toast.error("Photo not found");
      }
    } catch (error) {
      console.error("Failed to fetch photo:", error);
      toast.error("Failed to load photo");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading photo...</div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-4">Photo not found</div>
          <Link
            href="/gallery"
            className="text-violet-400 hover:text-violet-300"
          >
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/gallery"
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Gallery
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Photo Viewer */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">{photo.title}</h1>
                {photo.description && (
                  <p className="text-gray-300 mb-4">{photo.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {photo.dj.stageName}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(photo.createdAt)}
                  </div>
                  {photo.isFeatured && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      Featured
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Display */}
              <div className="relative bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.altText || photo.title}
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>

              {/* Photo Info */}
              <div className="mt-6 space-y-4">
                {photo.eventName && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400 mr-2">Event:</span>
                    <span className="font-medium">{photo.eventName}</span>
                  </div>
                )}

                {photo.eventType && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400 mr-2">Event Type:</span>
                    <span className="bg-violet-600 text-white px-2 py-1 rounded text-xs">
                      {photo.eventType}
                    </span>
                  </div>
                )}

                {photo.eventDate && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    Event Date: {formatDate(photo.eventDate)}
                  </div>
                )}

                {photo.venue && (
                  <div className="flex items-center text-sm text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    Venue: {photo.venue}
                  </div>
                )}

                {photo.location && (
                  <div className="flex items-center text-sm text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location: {photo.location}
                  </div>
                )}

                {photo.tags.length > 0 && (
                  <div className="flex items-start text-sm">
                    <Tag className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                    <div className="flex flex-wrap gap-2">
                      {photo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Comments</h2>
              <CommentSection commentType="photo" itemId={photo.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-xl p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">About this Photo</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Photographer</div>
                  <div className="flex items-center">
                    {photo.dj.userProfileImage ? (
                      <img
                        src={photo.dj.userProfileImage}
                        alt={photo.dj.stageName}
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs text-gray-300 font-medium">
                          {photo.dj.stageName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium">{photo.dj.stageName}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Uploaded</div>
                  <div className="font-medium">
                    {formatDate(photo.createdAt)}
                  </div>
                </div>

                {photo.eventName && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Event</div>
                    <div className="font-medium">{photo.eventName}</div>
                  </div>
                )}

                {photo.eventType && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Event Type</div>
                    <div className="font-medium">{photo.eventType}</div>
                  </div>
                )}

                {photo.venue && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Venue</div>
                    <div className="font-medium">{photo.venue}</div>
                  </div>
                )}

                {photo.location && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Location</div>
                    <div className="font-medium">{photo.location}</div>
                  </div>
                )}

                {photo.isFeatured && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <div className="font-medium text-yellow-400">Featured</div>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <div className="mt-6">
                <a
                  href={photo.url}
                  download
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  Download Photo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
