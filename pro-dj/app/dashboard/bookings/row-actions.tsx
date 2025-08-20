"use client";
import { useState } from "react";

import toast from "react-hot-toast";
import { useSocketContext } from "../../../components/SocketProvider";
import {
  X,
  Copy,
  Check,
  XCircle,
  Clock,
  CreditCard,
  RefreshCw,
  DollarSign,
  Calendar,
} from "lucide-react";

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl: string;
}

function PaymentLinkModal({
  isOpen,
  onClose,
  paymentUrl,
}: PaymentLinkModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Payment Link</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Copy this link and send it to your client to complete payment:
        </p>
        <div className="relative">
          <input
            type="text"
            value={paymentUrl}
            readOnly
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(paymentUrl)
                .then(() => {
                  toast.success("Payment link copied!");
                })
                .catch(() => {
                  toast.error("Please copy the link manually");
                });
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            Copy
          </button>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingAmount: number;
  onRefundComplete: () => void;
}

function RefundModal({
  isOpen,
  onClose,
  bookingId,
  bookingAmount,
  onRefundComplete,
}: RefundModalProps) {
  const [reason, setReason] = useState("requested_by_customer");
  const [isPartial, setIsPartial] = useState(false);
  const [refundAmount, setRefundAmount] = useState(bookingAmount);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleRefund = async () => {
    if (!reason) {
      toast.error("Please select a reason for the refund");
      return;
    }

    if (isPartial && (refundAmount <= 0 || refundAmount > bookingAmount)) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason,
          partial: isPartial,
          amount: isPartial ? refundAmount : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Refund of $${data.refund.amount.toFixed(2)} processed successfully!`
        );
        onRefundComplete();
        onClose();
      } else {
        toast.error(data.error || "Failed to process refund");
      }
    } catch {
      toast.error("Failed to process refund");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Process Refund
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Refund Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Refund Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!isPartial}
                  onChange={() => {
                    setIsPartial(false);
                    setRefundAmount(bookingAmount);
                  }}
                  className="mr-2 text-violet-600"
                  disabled={isProcessing}
                />
                <span className="text-gray-300">
                  Full Refund (${bookingAmount.toFixed(2)})
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={isPartial}
                  onChange={() => setIsPartial(true)}
                  className="mr-2 text-violet-600"
                  disabled={isProcessing}
                />
                <span className="text-gray-300">Partial Refund</span>
              </label>
            </div>
          </div>

          {/* Refund Amount (for partial refunds) */}
          {isPartial && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Refund Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  max={bookingAmount}
                  min={0}
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="0.00"
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          {/* Refund Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason for Refund
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              disabled={isProcessing}
            >
              <option value="requested_by_customer">Customer Request</option>
              <option value="duplicate">Duplicate Booking</option>
              <option value="fraudulent">Fraudulent Activity</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleRefund}
            disabled={isProcessing}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Process Refund
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Actions({
  id,
  status,
  onStatusChange,
  userRole,
  isPaid,
  quotedPriceCents,
  refundId,
  eventDate,
  eventType,
  startTime,
  endTime,
  message,
  details,
  onRefresh,
}: {
  id: string;
  status: string;
  checkoutSessionId?: string | null;
  onStatusChange?: (bookingId: string, newStatus: string) => void;
  userId?: string;
  userRole?: string;
  isPaid?: boolean;
  quotedPriceCents?: number | null;
  refundId?: string | null;
  eventDate?: string | Date;
  eventType?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  message?: string;
  details?:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | unknown[]
    | null;
  onRefresh?: () => void;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Calculate booking amount in dollars
  const bookingAmount = quotedPriceCents ? quotedPriceCents / 100 : 0;

  // Shared function to show payment link modal
  async function showPaymentLinkModal() {
    try {
      const res = await fetch(`/api/bookings/${id}/payment-link`, {
        method: "GET",
      });
      const data = await res.json();

      if (res.ok && data?.checkoutUrl) {
        setPaymentUrl(data.checkoutUrl);
        setShowPaymentModal(true);
      } else {
        toast.error("Could not retrieve payment link");
      }
    } catch (error) {
      toast.error("Failed to retrieve payment link");
    }
  }

  // Get WebSocket context for emitting updates
  const { emitBookingUpdate } = useSocketContext();

  async function run(kind: "accept" | "decline") {
    // Optimistic update - happens immediately
    if (onStatusChange) {
      if (kind === "accept") onStatusChange(id, "ACCEPTED");
      if (kind === "decline") onStatusChange(id, "DECLINED");
    }

    // Show success message immediately
    if (kind === "accept") toast.success("Accepted — payment link sent");
    if (kind === "decline") toast("Declined");

    // API call happens in background
    const res = await fetch(`/api/bookings/${id}/${kind}`, { method: "PATCH" });
    const j = await res.json().catch(() => null);
    if (!res.ok) {
      // Revert optimistic update on error
      if (onStatusChange) {
        if (kind === "accept") onStatusChange(id, "PENDING");
        if (kind === "decline") onStatusChange(id, "PENDING");
      }
      toast.error(j?.error ?? `Failed to ${kind}`);
      return;
    }

    // Emit WebSocket event for real-time updates
    const newStatus = kind === "accept" ? "ACCEPTED" : "DECLINED";
    emitBookingUpdate(id, newStatus);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-1 justify-end">
        {/* Only show accept/decline for DJs and admins */}
        {status === "PENDING" &&
          (userRole === "DJ" || userRole === "ADMIN") && (
            <>
              <button
                onClick={() => run("accept")}
                className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Check size={12} />
                Accept
              </button>
              <button
                onClick={() => run("decline")}
                className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <XCircle size={12} />
                Decline
              </button>
            </>
          )}
        {/* Show payment link for DJs and admins when accepted */}
        {status === "ACCEPTED" &&
          (userRole === "DJ" || userRole === "ADMIN") && (
            <button
              onClick={showPaymentLinkModal}
              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Copy size={12} />
              Payment
            </button>
          )}

        {/* Show refund button for DJs and admins when booking is confirmed and paid */}
        {status === "CONFIRMED" &&
          isPaid &&
          (userRole === "DJ" || userRole === "ADMIN") && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw size={12} />
              Refund
            </button>
          )}

        {/* Show "Book Another DJ" button for clients with refunded future events */}
        {userRole === "CLIENT" &&
          refundId &&
          eventDate &&
          new Date(eventDate) > new Date() && (
            <button
              onClick={() => {
                // Extract details from the booking
                const bookingDetails =
                  typeof details === "object" && details !== null
                    ? (details as Record<string, unknown>)
                    : {};
                const contactEmail = String(bookingDetails.contactEmail || "");
                const preferredGenres = Array.isArray(
                  bookingDetails.preferredGenres
                )
                  ? bookingDetails.preferredGenres.join(",")
                  : "";
                const musicStyle = String(bookingDetails.musicStyle || "");
                const clientEquipment = String(
                  bookingDetails.clientEquipment || ""
                );
                // Extract all possible extra fields for different event types
                const age = String(bookingDetails.age || "");
                const venueName = String(bookingDetails.venueName || "");
                const guestCount = String(bookingDetails.guestCount || "");
                const clubName = String(bookingDetails.clubName || "");
                const companyName = String(bookingDetails.companyName || "");

                const eventDetails = String(message || "");

                const params = new URLSearchParams({
                  eventType: eventType || "",
                  eventDate: eventDate
                    ? new Date(eventDate).toISOString().split("T")[0]
                    : "",
                  startTime: startTime
                    ? new Date(startTime).toTimeString().slice(0, 5)
                    : "",
                  endTime: endTime
                    ? new Date(endTime).toTimeString().slice(0, 5)
                    : "",

                  quotedPriceCents: quotedPriceCents?.toString() || "",
                  contactEmail: contactEmail,
                  preferredGenres: preferredGenres,
                  musicStyle: musicStyle,
                  clientEquipment: clientEquipment,
                  age: age,
                  venueName: venueName,
                  guestCount: guestCount,
                  clubName: clubName,
                  companyName: companyName,
                  eventDetails: eventDetails,
                  fromRefund: "true",
                });
                window.location.href = `/book?${params.toString()}`;
              }}
              className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Calendar size={12} />
              Book Another DJ
            </button>
          )}
        {/* Show action info for clients */}
        {userRole === "CLIENT" && (
          <div className="text-xs px-2 py-1">
            {status === "PENDING" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-900/40 text-yellow-200 border border-yellow-700/30">
                <Clock size={10} />
                Waiting for DJ
              </span>
            )}
            {status === "ACCEPTED" && (
              <div className="flex flex-col gap-1">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-900/40 text-blue-200 border border-blue-700/30">
                  <CreditCard size={10} />
                  Complete payment
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={showPaymentLinkModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-1.5 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Copy size={10} />
                    Copy Link
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/bookings/${id}/payment-link`,
                          {
                            method: "GET",
                          }
                        );
                        const data = await res.json();

                        if (res.ok && data?.checkoutUrl) {
                          window.open(data.checkoutUrl, "_blank");
                        } else {
                          toast.error(
                            data?.error || "Could not retrieve payment link"
                          );
                        }
                      } catch (error) {
                        toast.error("Failed to open payment link");
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-1.5 py-0.5 rounded text-xs font-medium transition-colors"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}
            {status === "CONFIRMED" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-900/40 text-green-200 border border-green-700/30">
                <Check size={10} />
                Booking confirmed
              </span>
            )}
            {status === "DECLINED" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-900/40 text-red-200 border border-red-700/30">
                <XCircle size={10} />
                Booking declined
              </span>
            )}
          </div>
        )}
      </div>

      <PaymentLinkModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentUrl={paymentUrl}
      />

      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        bookingId={id}
        bookingAmount={bookingAmount}
        onRefundComplete={() => {
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </>
  );
}
