"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Globe,
  Music,
  Video,
  Edit,
  Save,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  soundcloud?: string;
  youtube?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
}

interface SocialMediaManagerProps {
  djId: string;
  initialSocialLinks?: SocialLinks;
  onUpdate?: (socialLinks: SocialLinks) => void;
  showContent?: boolean; // Optional since Instagram setup guide moved to Social Media page
}

export default function SocialMediaManager({
  djId,
  initialSocialLinks = {},
  onUpdate,
  showContent = true,
}: SocialMediaManagerProps) {
  const { data: session } = useSession();
  const [socialLinks, setSocialLinks] =
    useState<SocialLinks>(initialSocialLinks);
  const [isEditing, setIsEditing] = useState(false);

  const socialPlatforms = [
    {
      key: "instagram",
      label: "Instagram",
      icon: Instagram,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      placeholder: "Enter Instagram handle (e.g., djusername)",
    },
    {
      key: "soundcloud",
      label: "SoundCloud",
      icon: Music,
      color: "bg-orange-500",
      placeholder: "Enter SoundCloud URL or handle",
    },
    {
      key: "youtube",
      label: "YouTube",
      icon: Video,
      color: "bg-red-600",
      placeholder: "Enter YouTube channel URL or handle",
    },
    {
      key: "twitter",
      label: "Twitter/X",
      icon: Twitter,
      color: "bg-blue-400",
      placeholder: "Enter Twitter/X handle",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: Facebook,
      color: "bg-blue-600",
      placeholder: "Enter Facebook page URL or handle",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700",
      placeholder: "Enter LinkedIn profile URL",
    },
    {
      key: "website",
      label: "Website",
      icon: Globe,
      color: "bg-gray-600",
      placeholder: "Enter website URL",
    },
  ];

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/dj/profile/social-links`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialLinks }),
      });

      if (response.ok) {
        toast.success("Social media links updated successfully");
        setIsEditing(false);
        onUpdate?.(socialLinks);

        // Reset Instagram cache and reload if Instagram handle was updated
        if (socialLinks.instagram) {
          // The Instagram feed display is removed, so no need to re-fetch here
        }
      } else {
        toast.error("Failed to update social media links");
      }
    } catch (error) {
      console.error("Error updating social links:", error);
      toast.error("Failed to update social media links");
    }
  };

  return (
    <div className="space-y-6">
      {/* Social Media Links Management */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Social Media Links</h3>
          {session?.user?.role === "DJ" && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-3 py-1 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
            >
              {isEditing ? (
                <X className="w-4 h-4 mr-1" />
              ) : (
                <Edit className="w-4 h-4 mr-1" />
              )}
              {isEditing ? "Cancel" : "Edit"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon;
            const value = socialLinks[platform.key as keyof SocialLinks] || "";

            return (
              <div key={platform.key} className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <Icon className="w-4 h-4 mr-2" />
                  {platform.label}
                  {platform.key === "instagram" && (
                    <span className="ml-2 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder={platform.placeholder}
                    value={value}
                    onChange={(e) =>
                      setSocialLinks((prev) => ({
                        ...prev,
                        [platform.key]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 truncate">
                      {value || "Not set"}
                    </span>
                    {value && (
                      <a
                        href={
                          value.startsWith("http")
                            ? value
                            : `https://${platform.key}.com/${value}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isEditing && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
