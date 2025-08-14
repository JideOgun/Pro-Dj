"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function DjRegisterPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    stageName: "",
    bio: "",
    genres: [] as string[],
    experience: 0,
    location: "",
    travelRadius: 50,
    basePriceCents: 0,
    profileImage: "",
    portfolio: [] as string[],
  });

  const availableGenres = [
    "Afrobeats",
    "Amapiano",
    "Hip-Hop",
    "R&B",
    "Pop",
    "House",
    "Techno",
    "Reggae",
    "Dancehall",
    "Latin",
    "EDM",
    "Rock",
    "Jazz",
    "Blues",
    "Country",
    "Gospel",
    "Classical",
    "Other",
  ];

  const handleGenreToggle = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/dj/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("DJ profile created successfully!");

        // Force a complete page reload to refresh the session with new role
        window.location.href = "/dashboard/dj";
      } else {
        toast.error(data.error || "Failed to create DJ profile");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="text-6xl mb-4">🎵</div>
            <h1 className="text-2xl font-bold mb-4">Join as a DJ</h1>
            <p className="text-gray-300 mb-6">
              Please sign in to create your DJ profile and start getting
              bookings.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/dj/register" })}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Your DJ Profile</h1>
          <p className="text-xl text-gray-300">
            Set up your profile to start receiving bookings
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stage Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stage Name *
              </label>
              <input
                type="text"
                value={formData.stageName}
                onChange={(e) =>
                  setFormData({ ...formData, stageName: e.target.value })
                }
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Your DJ name"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                placeholder="Tell clients about your style, experience, and what makes you unique..."
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Music Genres *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableGenres.map((genre) => (
                  <label
                    key={genre}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.genres.includes(genre)}
                      onChange={() => handleGenreToggle(genre)}
                      className="rounded border-gray-600 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-300">{genre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Years of Experience *
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.experience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experience: parseInt(e.target.value) || 0,
                  })
                }
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="City, State"
              />
            </div>

            {/* Travel Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Travel Radius (miles)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={formData.travelRadius}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    travelRadius: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Base Hourly Rate (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.basePriceCents / 100}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basePriceCents:
                      Math.round(parseFloat(e.target.value) * 100) || 0,
                  })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Profile Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profile Image URL
              </label>
              <input
                type="url"
                value={formData.profileImage}
                onChange={(e) =>
                  setFormData({ ...formData, profileImage: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="https://example.com/your-image.jpg"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
            >
              {isSubmitting ? "Creating Profile..." : "Create DJ Profile"}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-3 text-violet-400">
              What happens next?
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div>
                <div className="text-2xl mb-2">📝</div>
                <p>Your profile will be reviewed and verified</p>
              </div>
              <div>
                <div className="text-2xl mb-2">💰</div>
                <p>Set up your pricing packages</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🎵</div>
                <p>Start receiving booking requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
