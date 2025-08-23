"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Music,
  Camera,
  Play,
  MapPin,
  Star,
  Users,
  Filter,
  ArrowLeft,
  ArrowRight,
  Calendar,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

interface DJ {
  id: string;
  stageName: string;
  bio: string;
  profileImage: string | null;
  genres: string[];
  experience: number;
  location: string;
  basePriceCents: number;
  eventsOffered: string[];
  isApprovedByAdmin: boolean;
  isFeatured: boolean;
  isAcceptingBookings: boolean;
  totalMixes: number;
  totalEvents: number;
  averageRating: number;
  userId: string;
}

interface SearchFilters {
  location: string;
  genres: string[];
  eventTypes: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

function DJsPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    genres: [],
    eventTypes: [],
    priceRange: { min: 0, max: 1000 },
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDjs, setTotalDjs] = useState(0);
  const [itemsPerPage] = useState(12);

  // Available filters
  const availableGenres = [
    "Hip Hop",
    "R&B",
    "Pop",
    "Rock",
    "Electronic",
    "House",
    "Techno",
    "Afrobeats",
    "Reggae",
    "Jazz",
    "Blues",
    "Country",
    "Latin",
    "Classical",
  ];

  const availableEventTypes = [
    "Wedding",
    "Corporate",
    "Club",
    "Birthday",
    "Graduation",
    "Anniversary",
    "Holiday",
    "Festival",
    "Private Party",
  ];

  useEffect(() => {
    fetchDJs();
  }, [currentPage, searchTerm, filters]);

  const fetchDJs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        location: filters.location,
        genres: filters.genres.join(","),
        eventTypes: filters.eventTypes.join(","),
        minPrice: filters.priceRange.min.toString(),
        maxPrice: filters.priceRange.max.toString(),
      });

      const response = await fetch(`/api/djs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDjs(data.djs);
        setTotalPages(data.totalPages);
        setTotalDjs(data.totalDjs);
      } else {
        toast.error("Failed to load DJs");
      }
    } catch (error) {
      console.error("Error fetching DJs:", error);
      toast.error("Failed to load DJs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setCurrentPage(1);
  };

  const handleGenreToggle = (genre: string) => {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
    setCurrentPage(1);
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFilters((prev) => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter((e) => e !== eventType)
        : [...prev.eventTypes, eventType],
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      genres: [],
      eventTypes: [],
      priceRange: { min: 0, max: 1000 },
    });
    setCurrentPage(1);
  };

  const handleBookDJ = (djId: string) => {
    if (!session?.user) {
      toast.error("Please sign up to book a DJ");
      router.push("/auth");
      return;
    }
    router.push(`/book?djId=${djId}`);
  };

  const handleViewMixes = (djId: string) => {
    router.push(`/mixes?djId=${djId}`);
  };

  const handleViewPhotos = (djId: string) => {
    router.push(`/gallery?djId=${djId}`);
  };

  const handleViewVideos = (djId: string) => {
    router.push(`/videos?djId=${djId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900/40 to-purple-900/40 border-b border-violet-500/30">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              href="/"
              className="flex items-center space-x-2 text-violet-300 hover:text-violet-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Browse DJs
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Discover talented DJs for your next event. Search by location,
            genre, and more to find the perfect match.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search DJs by name, location, or genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </form>

          {/* Filter Toggle */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-violet-500 px-6 py-3 rounded-xl transition-all"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, State"
                    value={filters.location}
                    onChange={(e) =>
                      handleFilterChange("location", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price Range (per hour)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) =>
                        handleFilterChange("priceRange", {
                          ...filters.priceRange,
                          min: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) =>
                        handleFilterChange("priceRange", {
                          ...filters.priceRange,
                          max: parseInt(e.target.value) || 1000,
                        })
                      }
                      className="w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Genres */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genres
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {availableGenres.map((genre) => (
                      <label
                        key={genre}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={filters.genres.includes(genre)}
                          onChange={() => handleGenreToggle(genre)}
                          className="rounded border-gray-600 text-violet-500 focus:ring-violet-500"
                        />
                        <span className="text-gray-300">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Event Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Types
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {availableEventTypes.map((eventType) => (
                      <label
                        key={eventType}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={filters.eventTypes.includes(eventType)}
                          onChange={() => handleEventTypeToggle(eventType)}
                          className="rounded border-gray-600 text-violet-500 focus:ring-violet-500"
                        />
                        <span className="text-gray-300">{eventType}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 text-center">
                <button
                  onClick={clearFilters}
                  className="text-violet-400 hover:text-violet-300 text-sm underline"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-300">
            Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, totalDjs)} of {totalDjs} DJs
          </p>
          {filters.genres.length > 0 ||
            filters.eventTypes.length > 0 ||
            (filters.location && (
              <div className="flex flex-wrap gap-2">
                {filters.location && (
                  <span className="bg-violet-900/30 text-violet-200 px-3 py-1 rounded-full text-sm">
                    Location: {filters.location}
                  </span>
                )}
                {filters.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-blue-900/30 text-blue-200 px-3 py-1 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
                {filters.eventTypes.map((eventType) => (
                  <span
                    key={eventType}
                    className="bg-green-900/30 text-green-200 px-3 py-1 rounded-full text-sm"
                  >
                    {eventType}
                  </span>
                ))}
              </div>
            ))}
        </div>

        {/* DJs Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-2xl p-6 animate-pulse"
              >
                <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : djs.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No DJs found
            </h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search terms or filters to find more DJs.
            </p>
            <button
              onClick={clearFilters}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {djs.map((dj) => (
              <div
                key={dj.id}
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300"
              >
                {/* Profile Image */}
                <div className="text-center mb-4">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    {dj.profileImage ? (
                      <Image
                        src={dj.profileImage}
                        alt={dj.stageName}
                        fill
                        className="rounded-full object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {dj.isFeatured && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">
                    {dj.stageName}
                  </h3>
                  {dj.location && (
                    <div className="flex items-center justify-center text-sm text-gray-400 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {dj.location}
                    </div>
                  )}
                </div>

                {/* Bio */}
                {dj.bio && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {dj.bio}
                  </p>
                )}

                {/* Genres */}
                {dj.genres && dj.genres.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {dj.genres.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="bg-violet-900/30 text-violet-200 px-2 py-1 rounded-full text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                      {dj.genres.length > 3 && (
                        <span className="text-gray-400 text-xs">
                          +{dj.genres.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="text-center">
                    <div className="text-white font-semibold">
                      {dj.totalMixes}
                    </div>
                    <div className="text-gray-400">Mixes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">
                      {dj.totalEvents}
                    </div>
                    <div className="text-gray-400">Events</div>
                  </div>
                </div>

                {/* Price */}
                {dj.basePriceCents > 0 && (
                  <div className="flex items-center justify-center text-sm text-gray-300 mb-4">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>${Math.round(dj.basePriceCents / 100)}/hour</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleViewMixes(dj.id)}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Listen to Mixes
                  </button>

                  <button
                    onClick={() => handleViewPhotos(dj.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    View Photos
                  </button>

                  <button
                    onClick={() => handleViewVideos(dj.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    YouTube Sets
                  </button>

                  <button
                    onClick={() => handleBookDJ(dj.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book This DJ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-12">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 border border-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-violet-600 text-white"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 border border-gray-700 rounded-lg transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DJsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DJsPageContent />
    </Suspense>
  );
}
