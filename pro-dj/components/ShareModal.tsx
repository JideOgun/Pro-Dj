"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  artist: string;
  url: string;
  description?: string;
}

interface Platform {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  enabled: boolean;
  shareUrl: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  artist,
  url,
  description = "Check out this amazing mix on Pro-DJ!",
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const shareText = `${title} by ${artist}\n\n${description}`;

  const platforms: Platform[] = [
    {
      name: "Twitter",
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "bg-blue-500 hover:bg-blue-600",
      enabled: true,
      shareUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(url)}`,
    },
    {
      name: "Facebook",
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      color: "bg-blue-600 hover:bg-blue-700",
      enabled: true,
      shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "Instagram",
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      color:
        "bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      enabled: true,
      shareUrl: `https://www.instagram.com/?url=${encodeURIComponent(url)}`,
    },
    {
      name: "WhatsApp",
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
        </svg>
      ),
      color: "bg-green-500 hover:bg-green-600",
      enabled: true,
      shareUrl: `https://wa.me/?text=${encodeURIComponent(
        shareText + " " + url
      )}`,
    },
    {
      name: "Telegram",
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      color: "bg-blue-500 hover:bg-blue-600",
      enabled: true,
      shareUrl: `https://t.me/share/url?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Copy Link",
      icon: Copy,
      color: "bg-gray-600 hover:bg-gray-700",
      enabled: true,
      shareUrl: "",
    },
  ];

  const handleShare = async (platform: Platform) => {
    if (platform.name === "Copy Link") {
      await handleCopyAll();
      return;
    }

    if (platform.enabled) {
      window.open(platform.shareUrl, "_blank", "noopener,noreferrer");
      toast.success(`Shared on ${platform.name}!`, {
        icon: "✅",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleCopyAll = async () => {
    setCopying(true);
    const fullText = `${shareText}\n\nListen here: ${url}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("Mix details copied to clipboard!", {
        icon: "📋",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    } finally {
      setCopying(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-semibold text-white"
              >
                Share Mix
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Mix Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
            >
              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
              <p className="text-gray-400 text-sm">by {artist}</p>
              <p className="text-gray-500 text-xs mt-2">{description}</p>
            </motion.div>

            {/* Share Platforms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              {platforms.map((platform, index) => (
                <motion.button
                  key={platform.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShare(platform)}
                  disabled={!platform.enabled}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${
                    platform.enabled
                      ? `${platform.color} text-white shadow-lg hover:shadow-xl`
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
                </motion.button>
              ))}
            </motion.div>

            {/* Copy All Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyAll}
              disabled={copying}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              {copying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copying ? "Copying..." : copied ? "Copied!" : "Copy Mix Details"}
            </motion.button>

            {/* URL Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
            >
              <p className="text-xs text-gray-400 mb-2">Direct Link:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    handleShare(platforms.find((p) => p.name === "Copy Link")!)
                  }
                  className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => window.open(url, "_blank")}
                  className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded transition-colors"
                  title="Open link"
                >
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
