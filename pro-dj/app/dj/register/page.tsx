"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Music, DollarSign, MapPin } from "lucide-react";

export default function DjRegisterPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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
    customGenres: "",
    specialties: "",
    equipment: "",
    languages: [] as string[],
    availability: "",
    socialLinks: {
      instagram: "",
      youtube: "",
      soundcloud: "",
      website: "",
    },
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
    "Trap",
    "Dubstep",
    "Trance",
    "Disco",
    "Funk",
    "Soul",
    "Alternative",
    "Indie",
    "Electronic",
    "World Music",
    "Folk",
    "Punk",
    "Metal",
    "Other",
  ];

  const availableLanguages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Swahili",
    "Yoruba",
    "Igbo",
    "Hausa",
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

  const handleLanguageToggle = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  // Get current location using browser geolocation
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Try multiple approaches to get better city data
      let response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1&accept-language=en`
      );

      // If that doesn't work well, try with a different zoom level
      if (!response.ok) {
        response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=en`
        );
      }

      if (response.ok) {
        const data = await response.json();

        // Extract city, state, and country from the address data
        const address = data.address || {};

        // More robust city detection
        let city = "Unknown City";

        // First try: Direct address fields (excluding county)
        const directCity =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.suburb ||
          address.neighbourhood ||
          address.district;

        if (directCity && directCity !== address.county) {
          city = directCity;
        }

        // Second try: Parse display_name if direct fields failed
        if (city === "Unknown City" && data.display_name) {
          const displayParts = data.display_name.split(", ");
          console.log("Display parts:", displayParts);

          // Look for the first part that looks like a city
          for (const part of displayParts) {
            const cleanPart = part.trim();
            if (
              cleanPart.length > 2 &&
              !cleanPart.toLowerCase().includes("county") &&
              !cleanPart.toLowerCase().includes("state") &&
              !cleanPart.toLowerCase().includes("country") &&
              !cleanPart.toLowerCase().includes("united states") &&
              !cleanPart.toLowerCase().includes("usa") &&
              !cleanPart.toLowerCase().includes("postcode") &&
              !cleanPart.toLowerCase().includes("zip") &&
              !cleanPart.match(/^\d+$/) && // Not just numbers
              !cleanPart.match(/^[A-Z]{2}$/)
            ) {
              // Not state abbreviations
              city = cleanPart;
              console.log("Found city from display_name:", city);
              break;
            }
          }
        }

        // Third try: Use county as last resort if nothing else found
        if (city === "Unknown City" && address.county) {
          city = address.county;
          console.log("Using county as city:", city);
        }

        // Get state
        const state =
          address.state ||
          address.province ||
          address.region ||
          "Unknown State";

        // Get country
        const country = address.country || "Unknown Country";

        // Format as "City, State, Country"
        const location = `${city}, ${state}, ${country}`;

        setFormData((prev) => ({
          ...prev,
          location: location,
        }));

        toast.success("Location detected successfully!");
      } else {
        toast.error("Could not determine location name");
      }
    } catch (error) {
      console.error("Geolocation error:", error);
      toast.error(
        "Could not get your current location. Please enter manually."
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.location || formData.location.trim() === "") {
      toast.error(
        "Location is required. Please enter your location or use the 'Current' button to detect it automatically."
      );
      return;
    }

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
            <Music className="w-16 h-16 mb-4 mx-auto" />
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
          <p className="text-xl text-gray-300 mb-4">
            Set up your profile to start receiving bookings
          </p>
          <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-violet-200 text-sm">
              💡 <strong>Profile Integration:</strong> The information you
              provide here will automatically be used to prefill your user
              profile, so you won&apos;t need to enter it twice!
            </p>
          </div>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
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
              <input
                type="text"
                value={formData.customGenres}
                onChange={(e) =>
                  setFormData({ ...formData, customGenres: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Add custom genres (comma separated)"
              />
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Specialties & Unique Skills
              </label>
              <textarea
                value={formData.specialties}
                onChange={(e) =>
                  setFormData({ ...formData, specialties: e.target.value })
                }
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                placeholder="e.g., Live remixing, MC skills, bilingual announcements, special effects, lighting coordination..."
              />
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Equipment & Setup
              </label>
              <textarea
                value={formData.equipment}
                onChange={(e) =>
                  setFormData({ ...formData, equipment: e.target.value })
                }
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                placeholder="e.g., Pioneer CDJ-3000, DJM-900NXS2, Professional lighting rig, smoke machines..."
              />
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Languages Spoken
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {availableLanguages.map((language) => (
                  <label
                    key={language}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={() => handleLanguageToggle(language)}
                      className="rounded border-gray-600 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-300">{language}</span>
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="City, State or use current location"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {isLocating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Locating...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Current
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Click &quot;Current&quot; to automatically detect your city and
                state
              </p>
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

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Availability & Schedule
              </label>
              <textarea
                value={formData.availability}
                onChange={(e) =>
                  setFormData({ ...formData, availability: e.target.value })
                }
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                placeholder="e.g., Available weekends, weekdays after 6 PM, 24-hour notice required, flexible for special events..."
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Social Media & Links
              </label>
              <div className="space-y-3">
                <input
                  type="url"
                  value={formData.socialLinks.instagram}
                  onChange={(e) =>
                    handleSocialLinkChange("instagram", e.target.value)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Instagram URL"
                />
                <input
                  type="url"
                  value={formData.socialLinks.youtube}
                  onChange={(e) =>
                    handleSocialLinkChange("youtube", e.target.value)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="YouTube URL"
                />
                <input
                  type="url"
                  value={formData.socialLinks.soundcloud}
                  onChange={(e) =>
                    handleSocialLinkChange("soundcloud", e.target.value)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="SoundCloud URL"
                />
                <input
                  type="url"
                  value={formData.socialLinks.website}
                  onChange={(e) =>
                    handleSocialLinkChange("website", e.target.value)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Website URL"
                />
              </div>
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
                <DollarSign className="w-6 h-6 mb-2" />
                <p>Set up your pricing packages</p>
              </div>
              <div>
                <Music className="w-6 h-6 mb-2" />
                <p>Start receiving booking requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
