"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { DollarSign, MapPin, Upload, X, Camera } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// Type assertion to fix TypeScript issue
const ReactCropComponent = ReactCrop as any;

export default function DjRegisterPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const majorAmericanCities = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "San Diego, CA",
    "Dallas, TX",
    "San Jose, CA",
    "Austin, TX",
    "Jacksonville, FL",
    "Fort Worth, TX",
    "Columbus, OH",
    "Charlotte, NC",
    "San Francisco, CA",
    "Indianapolis, IN",
    "Seattle, WA",
    "Denver, CO",
    "Washington, DC",
    "Boston, MA",
    "El Paso, TX",
    "Nashville, TN",
    "Detroit, MI",
    "Oklahoma City, OK",
    "Portland, OR",
    "Las Vegas, NV",
    "Memphis, TN",
    "Louisville, KY",
    "Baltimore, MD",
    "Milwaukee, WI",
    "Albuquerque, NM",
    "Tucson, AZ",
    "Fresno, CA",
    "Sacramento, CA",
    "Mesa, AZ",
    "Kansas City, MO",
    "Atlanta, GA",
    "Long Beach, CA",
    "Colorado Springs, CO",
    "Raleigh, NC",
    "Miami, FL",
    "Virginia Beach, VA",
    "Omaha, NE",
    "Oakland, CA",
    "Minneapolis, MN",
    "Tampa, FL",
    "Tulsa, OK",
    "Arlington, TX",
    "New Orleans, LA",
    "Wichita, KS",
    "Cleveland, OH",
    "Bakersfield, CA",
    "Aurora, CO",
    "Anaheim, CA",
    "Honolulu, HI",
    "Santa Ana, CA",
    "Corpus Christi, TX",
    "Riverside, CA",
    "Lexington, KY",
    "Stockton, CA",
    "Henderson, NV",
    "Saint Paul, MN",
    "St. Louis, MO",
    "Fort Wayne, IN",
    "Jersey City, NJ",
    "Chandler, AZ",
    "Madison, WI",
    "Lubbock, TX",
    "Scottsdale, AZ",
    "Reno, NV",
    "Buffalo, NY",
    "Gilbert, AZ",
    "Glendale, AZ",
    "North Las Vegas, NV",
    "Winston-Salem, NC",
    "Chesapeake, VA",
    "Norfolk, VA",
    "Fremont, CA",
    "Garland, TX",
    "Irving, TX",
    "Hialeah, FL",
    "Richmond, VA",
    "Boise, ID",
    "Spokane, WA",
    "Baton Rouge, LA",
    "Tacoma, WA",
    "San Bernardino, CA",
    "Grand Rapids, MI",
    "Huntsville, AL",
    "Salt Lake City, UT",
    "Frisco, TX",
    "Yonkers, NY",
    "Amarillo, TX",
    "Glendale, CA",
    "McKinney, TX",
    "Montgomery, AL",
    "Aurora, IL",
    "Akron, OH",
    "Little Rock, AR",
    "Durham, NC",
    "Reno, NV",
    "Modesto, CA",
    "Arlington, VA",
    "Oxnard, CA",
    "Fontana, CA",
    "Columbus, GA",
    "Moreno Valley, CA",
    "Fayetteville, NC",
    "Huntington Beach, CA",
    "Yuma, AZ",
    "Worcester, MA",
    "Rochester, NY",
    "Cape Coral, FL",
    "Palm Springs, CA",
    "Palm Bay, FL",
    "Springfield, MO",
    "Salem, OR",
    "Corona, CA",
    "Eugene, OR",
    "Pasadena, CA",
    "Joliet, IL",
    "Pembroke Pines, FL",
    "Paterson, NJ",
    "Hampton, VA",
    "Lancaster, CA",
    "Alexandria, VA",
    "Salinas, CA",
    "Palmdale, CA",
    "Naperville, IL",
    "Pomona, CA",
    "Hayward, CA",
    "Lakewood, CO",
    "Escondido, CA",
    "Sunnyvale, CA",
    "Torrance, CA",
    "Sandy Springs, GA",
    "Olathe, KS",
    "Pasadena, TX",
    "Metairie, LA",
    "Columbia, SC",
    "Surprise, AZ",
    "Roseville, CA",
    "Thornton, CO",
    "McAllen, TX",
    "Lake Forest, CA",
    "Hollywood, FL",
    "Denton, TX",
    "Sterling Heights, MI",
    "Garden Grove, CA",
    "Cary, NC",
    "Oceanside, CA",
    "Elk Grove, CA",
    "Santa Rosa, CA",
    "Rancho Cucamonga, CA",
    "Fort Lauderdale, FL",
    "Peoria, AZ",
    "Springfield, MA",
    "Murfreesboro, TN",
    "Temecula, CA",
    "Lancaster, PA",
    "Eugene, OR",
    "Palm Bay, FL",
    "Salem, OR",
    "Pasadena, TX",
    "Pembroke Pines, FL",
    "Paterson, NJ",
    "Hampton, VA",
    "Lancaster, CA",
    "Alexandria, VA",
    "Salinas, CA",
    "Palmdale, CA",
    "Naperville, IL",
    "Pomona, CA",
    "Hayward, CA",
    "Lakewood, CO",
    "Escondido, CA",
    "Sunnyvale, CA",
    "Torrance, CA",
    "Sandy Springs, GA",
    "Olathe, KS",
    "Metairie, LA",
    "Columbia, SC",
    "Surprise, AZ",
    "Roseville, CA",
    "Thornton, CO",
    "McAllen, TX",
    "Lake Forest, CA",
    "Hollywood, FL",
    "Denton, TX",
    "Sterling Heights, MI",
    "Garden Grove, CA",
    "Cary, NC",
    "Oceanside, CA",
    "Elk Grove, CA",
    "Santa Rosa, CA",
    "Rancho Cucamonga, CA",
    "Fort Lauderdale, FL",
    "Peoria, AZ",
    "Springfield, MA",
    "Murfreesboro, TN",
    "Temecula, CA",
    "Lancaster, PA",
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

  // Profile picture upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setShowCropModal(true);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
  };

  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          }
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleCropSave = async () => {
    if (!selectedFile || !completedCrop || !imgRef.current) {
      toast.error("Please select a crop area");
      return;
    }

    setUploading(true);

    try {
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop
      );
      const croppedFile = new File([croppedImageBlob], selectedFile.name, {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("file", croppedFile);

      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.ok) {
        console.log("Profile image upload result:", result.data);
        setFormData((prev) => ({
          ...prev,
          profileImage: result.data.url,
        }));
        toast.success("Profile picture uploaded successfully!");
        setShowCropModal(false);
        setSelectedFile(null);
      } else {
        toast.error(result.error || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData((prev) => ({
      ...prev,
      profileImage: "",
    }));
    toast.success("Profile picture removed");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".location-input-container")) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Collect all validation errors
    const errorFields: string[] = [];

    if (!formData.stageName || formData.stageName.trim() === "") {
      errorFields.push("Stage Name");
    }

    if (!formData.profileImage) {
      errorFields.push("Profile Picture");
    }

    if (!formData.location || formData.location.trim() === "") {
      errorFields.push("Location");
    }

    if (!formData.bio || formData.bio.trim() === "") {
      errorFields.push("Bio");
    }

    if (formData.genres.length === 0) {
      errorFields.push("Genres");
    }

    if (!formData.experience || formData.experience === 0) {
      errorFields.push("Experience");
    }

    if (!formData.basePriceCents || formData.basePriceCents <= 0) {
      errorFields.push("Base Rate");
    }

    // Show comprehensive error message if any fields are missing
    if (errorFields.length > 0) {
      const errorMessage = `Please fill in the following required fields: ${errorFields.join(
        ", "
      )}`;
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log(
        "Submitting DJ registration data:",
        JSON.stringify(formData, null, 2)
      );

      const response = await fetch("/api/dj/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        toast.success(
          "DJ profile created successfully! Your profile is now pending admin approval."
        );

        // Redirect to DJ dashboard
        window.location.href = "/dashboard/dj";
      } else {
        console.error("DJ registration failed:", data);
        toast.error(data.error || "Failed to create DJ profile");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="w-16 h-16 mb-4 mx-auto bg-gray-700 rounded-lg animate-pulse"></div>
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            <p className="text-gray-300 mb-6">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="w-16 h-16 mb-4 mx-auto text-4xl">🎵</div>
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
            <p className="text-yellow-200 text-sm mt-2">
              ⏳ <strong>Approval Process:</strong> After creating your profile,
              it will be reviewed by our admin team. You can upload mixes and
              manage your profile, but you won&apos;t receive booking requests
              until approved.
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
              <div className="mb-3">
                <p className="text-sm text-gray-400 mb-2">
                  This is how you&apos;ll be displayed to clients. You can
                  choose to include &quot;DJ&quot; or not:
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <div className="text-xs text-gray-400 mb-1">
                      Example with &quot;DJ&quot;:
                    </div>
                    <div className="text-sm text-white font-medium">
                      DJ Concept
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <div className="text-xs text-gray-400 mb-1">
                      Example without &quot;DJ&quot;:
                    </div>
                    <div className="text-sm text-white font-medium">
                      Concept
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Tip: Most professional DJs prefer just their name without
                  &quot;DJ&quot; prefix
                </p>
              </div>
              <input
                type="text"
                value={formData.stageName}
                onChange={(e) =>
                  setFormData({ ...formData, stageName: e.target.value })
                }
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="e.g., JAY BABA, DJ Concept, or just Concept"
              />
            </div>

            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profile Picture *
              </label>
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 mx-auto mb-4 border-2 border-gray-600">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploading}
                    />
                    <span className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </span>
                  </label>

                  {formData.profileImage && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  Recommended: Square image, 400x400px or larger
                </p>
              </div>
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
                <div className="flex-1 relative location-input-container">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({ ...formData, location: e.target.value });
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="City, State or use current location"
                  />

                  {/* City Dropdown */}
                  {showCityDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs text-gray-400 mb-2 px-2">
                          Major US Cities:
                        </div>
                        {majorAmericanCities
                          .filter(
                            (city) =>
                              city
                                .toLowerCase()
                                .includes(formData.location.toLowerCase()) ||
                              formData.location === ""
                          )
                          .slice(0, 10)
                          .map((city, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, location: city });
                                setShowCityDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                            >
                              {city}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

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
                Choose from major US cities or click &quot;Current&quot; to
                auto-detect your location
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
                <div className="w-6 h-6 mb-2 text-lg">💰</div>
                <p>Set up your pricing packages</p>
              </div>
              <div>
                <div className="w-6 h-6 mb-2 text-lg">🎵</div>
                <p>Start receiving booking requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Cropping Modal */}
      {showCropModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Crop Profile Picture
              </h3>
              <button
                onClick={handleCropCancel}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-4">
                Drag to select the area you want to crop. The image will be
                cropped to a square format.
              </p>

              <div className="flex justify-center">
                <ReactCropComponent
                  crop={crop}
                  onChange={(c: Crop) => setCrop(c)}
                  onComplete={handleCropComplete}
                  aspect={1}
                  circularCrop
                  className="max-w-full max-h-96"
                >
                  <img
                    ref={imgRef}
                    src={URL.createObjectURL(selectedFile)}
                    alt="Crop preview"
                    className="max-w-full max-h-96 object-contain"
                  />
                </ReactCropComponent>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCropCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                disabled={uploading || !completedCrop}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Save Cropped Image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
