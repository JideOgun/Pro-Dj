"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";

interface SuspensionNoticeProps {
  suspensionReason?: string | null;
  suspendedAt?: Date | null;
  suspendedBy?: string | null;
  currentUserId?: string | null;
}

export default function SuspensionNotice({
  suspensionReason,
  suspendedAt,
  suspendedBy,
  currentUserId,
}: SuspensionNoticeProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-red-200 font-semibold">Account Suspended</h3>
          </div>
          <p className="text-red-300 text-sm mb-2">
            {suspendedBy === currentUserId
              ? "Your account has been paused by you. You can reactivate it anytime from your account settings."
              : "Your account has been suspended by an administrator. You can still view your account information, but you cannot perform any actions until your account is reactivated."}
          </p>
          {suspensionReason && (
            <div className="mb-2">
              <span className="text-red-400 text-sm font-medium">Reason: </span>
              <span className="text-red-300 text-sm">{suspensionReason}</span>
            </div>
          )}
          {suspendedAt && (
            <div className="text-red-400 text-xs">
              Suspended on: {new Date(suspendedAt).toLocaleDateString()}
            </div>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300 transition-colors ml-4"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
