"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Camera,
  Upload,
  X,
  Save,
  User,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Crop as CropIcon,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
  };
  djProfile?: {
    id: string;
    stageName: string;
    bio?: string;
    genres: string[];
    experience: number;
    location?: string;
  };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
    website: "",
    socialLinks: {
      instagram: "",
      twitter: "",
      facebook: "",
      linkedin: "",
    },
  });

  // Phone validation state
  const [phoneError, setPhoneError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Image cropping state
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

  // Load profile data
  useEffect(() => {
    if (session?.user?.email) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const result = await response.json();

      if (result.ok) {
        setProfile(result.data);
        setFormData({
          name: result.data.name || "",
          phone: result.data.phone ? formatPhoneNumber(result.data.phone) : "",
          location: result.data.location || "",
          bio: result.data.bio || "",
          website: result.data.website || "",
          socialLinks: {
            instagram: result.data.socialLinks?.instagram || "",
            twitter: result.data.socialLinks?.twitter || "",
            facebook: result.data.socialLinks?.facebook || "",
            linkedin: result.data.socialLinks?.linkedin || "",
          },
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setMessage("Failed to load profile");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Phone number validation
  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, "");

    // Check if it's a valid phone number (7-15 digits)
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setPhoneError("Phone number must be between 7-15 digits");
      return false;
    }

    // Check if it contains only valid characters
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(digitsOnly)) {
      setPhoneError("Please enter a valid phone number");
      return false;
    }

    setPhoneError("");
    return true;
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "");

    // Format based on length
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else if (digitsOnly.length <= 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(
        3,
        6
      )}-${digitsOnly.slice(6)}`;
    } else {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(
        3,
        6
      )}-${digitsOnly.slice(6, 10)}`;
    }
  };

  // Get current location using browser geolocation
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser");
      setMessageType("error");
      return;
    }

    setIsLocating(true);
    setMessage("");

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

        // Debug: Log the available address fields
        console.log("Nominatim response:", data);
        console.log("Available address fields:", data.address);
        console.log("Display name:", data.display_name);

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

        setMessage("Location detected successfully!");
        setMessageType("success");
      } else {
        setMessage("Could not determine location name");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Geolocation error:", error);
      setMessage("Could not get your current location. Please enter manually.");
      setMessageType("error");
    } finally {
      setIsLocating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Validate phone number when it changes
    if (field === "phone") {
      validatePhone(value);
    }
  };

  const handleSaveProfile = async () => {
    // Validate required fields
    if (!formData.location || formData.location.trim() === "") {
      setMessage(
        "Location is required. Please enter your location or use the 'Current' button to detect it automatically."
      );
      setMessageType("error");
      return;
    }

    // Validate phone number before saving
    if (formData.phone && !validatePhone(formData.phone)) {
      setMessage("Please fix the phone number error before saving");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.ok) {
        setProfile(result.data);
        setMessage("Profile updated successfully!");
        setMessageType("success");
      } else {
        setMessage(result.error || "Failed to update profile");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file");
      setMessageType("error");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setMessage("File size must be less than 10MB");
      setMessageType("error");
      return;
    }

    setSelectedFile(file);
    setShowCropModal(true);
    setMessage("");
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
      setMessage("Please select a crop area");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");

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
        setProfile((prev) =>
          prev ? { ...prev, profileImage: result.data.url } : null
        );
        setMessage("Profile picture uploaded successfully!");
        setMessageType("success");
        setShowCropModal(false);
        setSelectedFile(null);

        // Dispatch event to update navbar profile image
        window.dispatchEvent(new CustomEvent("profile-updated"));
      } else {
        setMessage(result.error || "Failed to upload profile picture");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setMessage("Failed to upload profile picture");
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
    setCompletedCrop(undefined);
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const response = await fetch("/api/profile/upload", {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.ok) {
        setProfile((prev) =>
          prev ? { ...prev, profileImage: undefined } : null
        );
        setMessage("Profile picture removed");
        setMessageType("success");

        // Dispatch event to update navbar profile image
        window.dispatchEvent(new CustomEvent("profile-updated"));
      } else {
        setMessage(result.error || "Failed to remove profile picture");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error removing profile picture:", error);
      setMessage("Failed to remove profile picture");
      setMessageType("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
          <p className="text-xl text-gray-300">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              messageType === "success"
                ? "bg-green-900/50 text-green-200 border border-green-500/30"
                : "bg-red-900/50 text-red-200 border border-red-500/30"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>

              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 mx-auto mb-4">
                    {profile?.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
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

                  {profile?.profileImage && (
                    <button
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
          </div>

          {/* Profile Information Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">
                Profile Information
              </h2>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        handleInputChange("phone", formatted);
                      }}
                      className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                        phoneError ? "border-red-500" : "border-gray-600"
                      }`}
                      placeholder="(555) 123-4567"
                      maxLength={20}
                    />
                    {phoneError && (
                      <p className="text-red-400 text-sm mt-1">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      required
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Enter your location or use current location"
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
                    Click "Current" to automatically detect your location
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                {/* Social Media Links */}
                <div>
                  <h3 className="text-lg font-medium text-gray-200 mb-4">
                    Social Media Links
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={formData.socialLinks.instagram}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.instagram",
                            e.target.value
                          )
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="https://instagram.com/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Twitter
                      </label>
                      <input
                        type="url"
                        value={formData.socialLinks.twitter}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.twitter",
                            e.target.value
                          )
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="https://twitter.com/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={formData.socialLinks.facebook}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.facebook",
                            e.target.value
                          )
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="https://facebook.com/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={formData.socialLinks.linkedin}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.linkedin",
                            e.target.value
                          )
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
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
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
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
                </ReactCrop>
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
                <CropIcon className="w-4 h-4" />
                {uploading ? "Uploading..." : "Save Cropped Image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
