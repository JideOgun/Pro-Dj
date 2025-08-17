"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Mail, Share2, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  artist: string;
  url: string;
  description?: string;
}

interface SharePlatform {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  url: string;
  enabled: boolean;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  artist,
  url,
  description = "Check out this amazing mix!",
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `${title} by ${artist} - ${description}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  // Custom icon components for social media platforms
  const FacebookIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );

  const TwitterIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  );

  const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
    </svg>
  );

  const InstagramIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243 0-.49.122-.928.49-1.243.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243 0 .49-.122.928-.49 1.243-.369.315-.807.49-1.297.49z" />
    </svg>
  );

  const platforms: SharePlatform[] = [
    {
      name: "Facebook",
      icon: FacebookIcon,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      enabled: true,
    },
    {
      name: "Twitter/X",
      icon: TwitterIcon,
      color: "bg-black hover:bg-gray-800",
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      enabled: true,
    },
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      color: "bg-green-600 hover:bg-green-700",
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      enabled: true,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-600 hover:bg-gray-700",
      url: `mailto:?subject=${encodeURIComponent(
        title
      )}&body=${encodedText}%0A%0A${encodedUrl}`,
      enabled: true,
    },
    {
      name: "Instagram",
      icon: InstagramIcon,
      color:
        "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      url: `https://www.instagram.com/`,
      enabled: true, // Enable Instagram with custom handling
    },
    {
      name: "Copy Link",
      icon: copied ? Check : Copy,
      color: "bg-violet-600 hover:bg-violet-700",
      url: "",
      enabled: true,
    },
  ];

  const handleShare = async (platform: SharePlatform) => {
    if (platform.name === "Copy Link") {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      }
      return;
    }

    if (platform.name === "Instagram") {
      // Instagram doesn't support direct URL sharing, so we copy the link and show instructions
      try {
        await navigator.clipboard.writeText(url);
        toast.success(
          "Link copied! Open Instagram and paste the link in your story or post.",
          {
            duration: 4000,
            icon: "📱",
          }
        );
      } catch (error) {
        toast.error("Failed to copy link for Instagram");
      }
      return;
    }

    if (!platform.enabled) {
      toast.error(`${platform.name} sharing is not available`);
      return;
    }

    // Open in new window
    window.open(platform.url, "_blank", "width=600,height=400");
  };

  const handleCopyAll = async () => {
    const fullText = `${shareText}\n\nListen here: ${url}`;
    try {
      await navigator.clipboard.writeText(fullText);
      toast.success("Mix details copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Share Mix</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mix Info */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
              <p className="text-gray-400 text-sm">by {artist}</p>
              <p className="text-gray-500 text-xs mt-2">{description}</p>
            </div>

            {/* Share Platforms */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {platforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform)}
                  disabled={!platform.enabled}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${
                    platform.enabled
                      ? `${platform.color} text-white`
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                  title={
                    platform.enabled
                      ? `Share on ${platform.name}`
                      : `${platform.name} not available`
                  }
                >
                  <platform.icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium">{platform.name}</span>
                </button>
              ))}
            </div>

            {/* Copy All Button */}
            <button
              onClick={handleCopyAll}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Mix Details
            </button>

            {/* URL Display */}
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Direct Link:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600"
                />
                <button
                  onClick={() =>
                    handleShare(platforms.find((p) => p.name === "Copy Link")!)
                  }
                  className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
