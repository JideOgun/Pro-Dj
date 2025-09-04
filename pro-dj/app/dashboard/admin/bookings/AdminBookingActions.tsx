"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface Booking {
  id: string;
  status: string;
  eventType: string;
  eventDate: string | Date;
  user: {
    name: string | null;
    email: string;
  };
  dj: {
    stageName: string | null;
  } | null;
}

interface AdminBookingActionsProps {
  booking: Booking;
  currentAdminId: string;
}

export default function AdminBookingActions({
  booking,
  currentAdminId,
}: AdminBookingActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState(booking.status);
  const [statusReason, setStatusReason] = useState("");

  const handleStatusOverride = async () => {
    if (!statusReason.trim()) {
      toast.error("Please provide a reason for the status change");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason,
          adminId: currentAdminId,
        }),
      });

      if (response.ok) {
        toast.success("Booking status updated successfully");
        setShowStatusModal(false);
        setStatusReason("");
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update booking status");
      }
    } catch (error) {
      toast.error("Failed to update booking status");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusOptions = () => {
    const options = [
      { value: "PENDING_ADMIN_REVIEW", label: "Pending Review" },
      { value: "ADMIN_REVIEWING", label: "In Review" },
      { value: "DJ_ASSIGNED", label: "DJ Assigned" },
      { value: "CONFIRMED", label: "Confirmed" },
      { value: "CANCELLED", label: "Cancelled" },
    ];
    return options.filter((option) => option.value !== booking.status);
  };

  return (
    <>
      <button
        onClick={() => setShowStatusModal(true)}
        disabled={isLoading}
        className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-3 py-1 rounded text-sm font-medium transition-colors"
      >
        Override
      </button>

      {/* Status Override Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Override Booking Status
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Change the status for {booking.eventType} booking
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Status
              </label>
              <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
                {booking.status}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                {getStatusOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Change
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Enter reason for status change..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusReason("");
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusOverride}
                disabled={isLoading}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isLoading ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
