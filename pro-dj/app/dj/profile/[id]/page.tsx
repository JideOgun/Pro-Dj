import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Music,
  MapPin,
  Star,
  Calendar,
  Clock,
  DollarSign,
  ArrowLeft,
  Play,
  ExternalLink,
  Camera,
  ArrowRight,
} from "lucide-react";

interface DjProfilePageProps {
  params: {
    id: string;
  };
}

export default async function DjProfilePage({ params }: DjProfilePageProps) {
  const dj = await prisma.djProfile.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          userMedia: {
            where: { type: "PROFILE_PICTURE" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      eventPhotos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dj) {
    notFound();
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const profileImage = dj.user.profileImage || dj.user.userMedia[0]?.url;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="relative h-96 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20">
          {dj.eventPhotos.length > 0 && (
            <Image
              src={dj.eventPhotos[0].url}
              alt="Background"
              fill
              className="object-cover opacity-30"
            />
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/"
              className="bg-black/30 backdrop-blur-sm text-white p-3 rounded-lg hover:bg-black/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold">DJ Profile</h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden bg-gray-700 border-4 border-violet-500/30 shadow-2xl">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={dj.stageName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl text-gray-300 font-bold">
                      {dj.stageName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              {dj.isFeatured && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ⭐ Featured
                  </div>
                </div>
              )}
            </div>

            {/* DJ Info */}
            <div className="flex-1">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                {dj.stageName}
              </h2>
              <div className="flex items-center gap-4 text-lg text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{dj.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{dj.experience} years experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span>{dj.rating?.toFixed(1) || "New"}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/book?dj=${dj.id}`}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Music className="w-5 h-5" />
                  Book This DJ
                </Link>
                <Link
                  href={`/book`}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 hover:border-violet-500/50 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Browse All DJs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - DJ Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-violet-400">About</h3>
              {dj.bio ? (
                <p className="text-gray-300 leading-relaxed text-lg">
                  {dj.bio}
                </p>
              ) : (
                <p className="text-gray-400 italic">
                  No bio available for this DJ.
                </p>
              )}
            </div>

            {/* Genres Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-violet-400">
                Genres
              </h3>
              <div className="flex flex-wrap gap-3">
                {dj.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-violet-900/30 text-violet-200 px-4 py-2 rounded-full text-sm font-medium border border-violet-500/30"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-violet-400">
                Pricing
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-green-400">
                  {formatPrice(dj.basePriceCents)}/hour
                </div>
                <div className="text-gray-400">Starting rate</div>
              </div>
              <p className="text-gray-300 mt-4">
                Final pricing depends on event type, duration, and specific
                requirements. Contact us for a custom quote.
              </p>
            </div>

            {/* Event Photos */}
            {dj.eventPhotos.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-violet-400">
                  Event Portfolio
                </h3>

                {/* Group photos by events and create compact event cards */}
                {(() => {
                  // Group photos by event name
                  const eventsMap = new Map<
                    string,
                    {
                      eventName: string;
                      eventDate: Date | null;
                      eventType: string | null;
                      venue: string | null;
                      location: string | null;
                      photos: Array<{
                        id: string;
                        title: string;
                        description: string | null;
                        url: string;
                        altText: string | null;
                        tags: string[];
                        isFeatured: boolean;
                        createdAt: Date;
                      }>;
                    }
                  >();

                  dj.eventPhotos.forEach((photo) => {
                    const eventName = photo.eventName || "Uncategorized";

                    if (!eventsMap.has(eventName)) {
                      eventsMap.set(eventName, {
                        eventName,
                        eventDate: photo.eventDate,
                        eventType: photo.eventType,
                        venue: photo.venue,
                        location: photo.location,
                        photos: [],
                      });
                    }

                    const event = eventsMap.get(eventName)!;
                    event.photos.push({
                      id: photo.id,
                      title: photo.title,
                      description: photo.description,
                      url: photo.url,
                      altText: photo.altText,
                      tags: photo.tags,
                      isFeatured: photo.isFeatured,
                      createdAt: photo.createdAt,
                    });
                  });

                  const events = Array.from(eventsMap.values()).sort((a, b) => {
                    // Sort by event date (newest first), then by event name
                    if (a.eventDate && b.eventDate) {
                      return (
                        new Date(b.eventDate).getTime() -
                        new Date(a.eventDate).getTime()
                      );
                    }
                    return a.eventName.localeCompare(b.eventName);
                  });

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events.map((event) => {
                        // Get the first photo as cover and count total photos
                        const coverPhoto = event.photos[0];
                        const photoCount = event.photos.length;
                        const featuredCount = event.photos.filter(
                          (p) => p.isFeatured
                        ).length;

                        return (
                          <Link
                            key={event.eventName}
                            href={`/gallery/${encodeURIComponent(
                              event.eventName
                            )}`}
                            className="block bg-gray-900/30 rounded-xl overflow-hidden border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 group"
                          >
                            {/* Event Cover Image */}
                            <div className="relative aspect-[4/3] overflow-hidden">
                              <Image
                                src={coverPhoto.url}
                                alt={coverPhoto.altText || event.eventName}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />

                              {/* Photo Count Badge */}
                              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                                <Camera className="w-4 h-4 inline mr-1" />
                                {photoCount}{" "}
                                {photoCount === 1 ? "photo" : "photos"}
                              </div>

                              {/* Featured Badge */}
                              {featuredCount > 0 && (
                                <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                                  ⭐ {featuredCount} Featured
                                </div>
                              )}
                            </div>

                            {/* Event Info */}
                            <div className="p-4">
                              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                                {event.eventName}
                              </h4>

                              <div className="space-y-2 mb-3">
                                {/* Event Type */}
                                {event.eventType && (
                                  <div className="inline-block px-2 py-1 rounded-full text-xs font-medium border border-violet-500/30 text-violet-400 bg-violet-500/10">
                                    {event.eventType}
                                  </div>
                                )}

                                {/* Date */}
                                {event.eventDate && (
                                  <div className="flex items-center text-gray-400 text-sm">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>
                                      {new Date(
                                        event.eventDate
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}

                                {/* Venue/Location */}
                                {(event.venue || event.location) && (
                                  <div className="flex items-center text-gray-400 text-sm">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    <span className="truncate">
                                      {event.venue && event.location
                                        ? `${event.venue}, ${event.location}`
                                        : event.venue || event.location}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* View Event Button */}
                              <div className="inline-flex items-center text-violet-400 group-hover:text-violet-300 text-sm font-medium group-hover:translate-x-1 transition-all">
                                View Event Photos
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 text-violet-400">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Experience</span>
                  <span className="text-white font-semibold">
                    {dj.experience} years
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white font-semibold">
                      {dj.rating?.toFixed(1) || "New"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Events</span>
                  <span className="text-white font-semibold">
                    {dj.totalBookings || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Location</span>
                  <span className="text-white font-semibold">
                    {dj.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 text-violet-400">
                Contact & Booking
              </h3>
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Ready to book this DJ for your event? Click the button below
                  to start the booking process.
                </p>
                <Link
                  href={`/book?dj=${dj.id}`}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 flex items-center justify-center gap-2"
                >
                  <Music className="w-4 h-4" />
                  Book Now
                </Link>
                <p className="text-xs text-gray-400 text-center">
                  Secure booking with instant confirmation
                </p>
              </div>
            </div>

            {/* Similar DJs */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 text-violet-400">
                Looking for More?
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Browse our full selection of talented DJs for your event.
              </p>
              <Link
                href="/book"
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Browse All DJs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
