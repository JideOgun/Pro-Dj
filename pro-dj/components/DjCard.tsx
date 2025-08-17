"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Music, MapPin, Star, Calendar, ArrowRight, Play } from "lucide-react";

interface DjCardProps {
  dj: {
    id: string;
    stageName: string;
    genres: string[];
    location: string;
    experience: number;
    basePriceCents: number | null;
    bio: string | null;
    isFeatured: boolean;
    profileImage?: string;
    eventPhotos: Array<{
      id: string;
      url: string;
      title: string;
      eventName?: string;
      eventType?: string;
    }>;
    rating: number;
    totalBookings: number;
  };
}

export default function DjCard({ dj }: DjCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const formatPrice = (cents: number | null) => {
    if (!cents) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to DJ profile page
    window.open(`/dj/profile/${dj.id}`, "_blank");
  };

  return (
    <div
      className={`relative group bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden transition-all duration-500 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/20 ${
        isHovered ? "transform -translate-y-2" : ""
      } ${dj.isFeatured ? "ring-2 ring-violet-500/30" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Featured Badge */}
      {dj.isFeatured && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ⭐ Featured
          </div>
        </div>
      )}

      {/* Profile Image Section */}
      <div className="relative h-48 overflow-hidden">
        {dj.profileImage ? (
          <Image
            src={dj.profileImage}
            alt={dj.stageName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center">
            <Music className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Overlay with DJ info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-2">
              {dj.stageName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{dj.location}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-white">{dj.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-white">{dj.totalBookings} events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Photos Preview */}
        {dj.eventPhotos.length > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handlePhotoClick}
              className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-black/70 transition-colors group/photo"
            >
              <div className="relative w-12 h-12 rounded overflow-hidden">
                <Image
                  src={
                    dj.eventPhotos[currentPhotoIndex]?.url ||
                    dj.eventPhotos[0]?.url
                  }
                  alt="Event photo"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                  <Play className="w-4 h-4" />
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-violet-400 transition-colors">
              {dj.stageName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{dj.location}</span>
              <span>•</span>
              <span>{dj.experience} years exp.</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-violet-400">
              {formatPrice(dj.basePriceCents)}/hr
            </div>
            <div className="text-xs text-gray-400">Starting rate</div>
          </div>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-4">
          {dj.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="bg-violet-900/30 text-violet-200 px-3 py-1 rounded-full text-xs font-medium"
            >
              {genre}
            </span>
          ))}
          {dj.genres.length > 3 && (
            <span className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full text-xs">
              +{dj.genres.length - 3} more
            </span>
          )}
        </div>

        {/* Bio Preview */}
        {dj.bio && (
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{dj.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white font-medium">
              {dj.rating.toFixed(1)}
            </span>
            <span className="text-gray-400">({dj.totalBookings} events)</span>
          </div>
          {dj.isFeatured && (
            <div className="text-violet-400 font-medium">Featured DJ</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            href={`/book?dj=${dj.id}`}
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 group-hover:scale-105"
          >
            <Music className="w-4 h-4 inline mr-2" />
            Book Now
          </Link>
          <Link
            href={`/dj/profile/${dj.id}`}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors group-hover:scale-105"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-violet-500/0 group-hover:border-violet-500/30 rounded-2xl transition-all duration-500 pointer-events-none" />
    </div>
  );
}
