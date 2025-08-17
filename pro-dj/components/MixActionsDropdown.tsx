"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical,
  Trash2,
  Share2,
  Download,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

interface MixActionsDropdownProps {
  mixId: string;
  mixTitle: string;
  onDelete: (mixId: string) => void;
  onShare: () => void;
  canDelete: boolean;
  canDownload?: boolean;
}

export default function MixActionsDropdown({
  mixId,
  mixTitle,
  onDelete,
  onShare,
  canDelete,
  canDownload = false,
}: MixActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/mixes/${mixId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete(mixId);
  };

  const handleShare = () => {
    setIsOpen(false);
    onShare();
  };

  const handleDownload = () => {
    setIsOpen(false);
    // Create a temporary link element to trigger download
    const link = document.createElement("a");
    link.href = `/api/mixes/stream?id=${mixId}`;
    link.download = `${mixTitle}.mp3`; // Set the filename
    link.target = "_blank";

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Download started!", {
      icon: "⬇️",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  };

  const actions = [
    {
      label: "Share",
      icon: Share2,
      onClick: handleShare,
      enabled: true,
      className: "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20",
    },
    {
      label: "Copy Link",
      icon: copied ? Check : Copy,
      onClick: handleCopyLink,
      enabled: true,
      className: "text-green-400 hover:text-green-300 hover:bg-green-900/20",
    },
    {
      label: "Download",
      icon: Download,
      onClick: handleDownload,
      enabled: canDownload,
      className: "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20",
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: handleDelete,
      enabled: canDelete,
      className: "text-red-400 hover:text-red-300 hover:bg-red-900/20",
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-700/50 transition-colors duration-200 text-gray-400 hover:text-white"
        title="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {actions.map((action, index) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={!action.enabled}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors duration-200 ${
                  action.enabled
                    ? action.className
                    : "text-gray-500 cursor-not-allowed"
                } ${
                  index !== actions.length - 1 ? "border-b border-gray-700" : ""
                }`}
                title={
                  action.enabled
                    ? action.label
                    : `${action.label} not available`
                }
              >
                <action.icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
