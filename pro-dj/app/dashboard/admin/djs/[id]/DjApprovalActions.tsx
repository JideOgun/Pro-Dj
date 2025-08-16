"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  djProfile: {
    stageName: string | null;
  } | null;
}

interface DjApprovalActionsProps {
  user: User;
  currentAdminId: string;
}

export default function DjApprovalActions({
  user,
  currentAdminId,
}: DjApprovalActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApproveDj = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/djs/${user.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: currentAdminId }),
      });

      if (response.ok) {
        toast.success("DJ approved successfully!");
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to approve DJ");
      }
    } catch (error) {
      toast.error("Failed to approve DJ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectDj = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/djs/${user.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: rejectionReason,
          adminId: currentAdminId,
        }),
      });

      if (response.ok) {
        toast.success("DJ rejected successfully");
        setShowRejectModal(false);
        setRejectionReason("");
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to reject DJ");
      }
    } catch (error) {
      toast.error("Failed to reject DJ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">DJ Approval</h2>
      <p className="text-gray-300 mb-4">
        Review the DJ profile and decide whether to approve or reject their
        application.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={handleApproveDj}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
        >
          {isLoading ? "Approving..." : "✅ Approve DJ"}
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
        >
          ❌ Reject DJ
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Reject DJ Application
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Are you sure you want to reject{" "}
              {user.djProfile?.stageName || user.email}? This will remove their
              DJ profile and change their role back to client.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDj}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isLoading ? "Rejecting..." : "Reject DJ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
