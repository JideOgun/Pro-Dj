"use client";

import { useState, useEffect } from "react";
import DjCard from "./DjCard";
import { Music, Loader2, AlertCircle } from "lucide-react";

interface Dj {
  id: string;
  stageName: string;
  genres: string[];
  location: string;
  experience: number;
  basePriceCents: number | null;
  bio: string | null;
  isFeatured: boolean;
  userProfileImage?: string;
  eventPhotos: Array<{
    id: string;
    url: string;
    title: string;
    eventName?: string;
    eventType?: string;
  }>;
  rating: number;
  totalBookings: number;
}

interface DjShowcaseProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  featured?: boolean;
  showViewAll?: boolean;
}

export default function DjShowcase({
  title = "Featured DJs",
  subtitle = "Discover talented DJs for your next event",
  limit = 6,
  featured = false,
  showViewAll = true,
}: DjShowcaseProps) {
  const [djs, setDjs] = useState<Dj[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDjs = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(featured && { featured: "true" }),
        });

        const response = await fetch(`/api/djs/featured?${params}`);
        const result = await response.json();

        if (result.ok) {
          setDjs(result.data);
        } else {
          setError(result.error || "Failed to load DJs");
        }
      } catch (err) {
        console.error("Error fetching DJs:", err);
        setError("Failed to load DJs");
      } finally {
        setLoading(false);
      }
    };

    fetchDjs();
  }, [limit, featured]);

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading amazing DJs...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (djs.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No DJs Available
              </h3>
              <p className="text-gray-400">
                Check back soon for amazing DJs joining our platform!
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* DJ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {djs.map((dj) => (
            <DjCard key={dj.id} dj={dj} />
          ))}
        </div>

        {/* View All Button */}
        {showViewAll && djs.length > 0 && (
          <div className="text-center">
            <a
              href="/book"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Music className="w-5 h-5" />
              View All DJs & Book Now
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
