"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSocketContext } from "../../../components/SocketProvider";
import { X, Copy, Check, XCircle, Clock, CreditCard } from "lucide-react";

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

export default function Actions({
  id,
  status,
  checkoutSessionId,
  onStatusChange,
  userId,
  userRole,
}: {
  id: string;
  status: string;
  checkoutSessionId?: string | null;
  onStatusChange?: (bookingId: string, newStatus: string) => void;
  userId?: string;
  userRole?: string;
}) {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");

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

  async function showPaymentLink() {
    console.log("🔍 Show payment link clicked for booking:", id);
    try {
      const res = await fetch(`/api/bookings/${id}/payment-link`, {
        method: "GET",
      });
      console.log("📡 API response status:", res.status);
      const data = await res.json();
      console.log("📋 API response data:", data);

      if (res.ok && data?.checkoutUrl) {
        console.log("🔗 Payment URL:", data.checkoutUrl);
        setPaymentUrl(data.checkoutUrl);
        setShowPaymentModal(true);
      } else {
        toast.error("Could not retrieve payment link");
        console.log(
          "❌ Failed to get payment link:",
          data?.error || "Unknown error"
        );
      }
    } catch (error) {
      toast.error("Failed to retrieve payment link");
      console.error("❌ Show payment link error:", error);
    }
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
              onClick={showPaymentLink}
              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Copy size={12} />
              Payment
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
                          await navigator.clipboard.writeText(data.checkoutUrl);
                          toast.success("Payment link copied to clipboard!");
                        } else {
                          toast.error(
                            data?.error || "Could not retrieve payment link"
                          );
                        }
                      } catch (error) {
                        toast.error("Failed to copy payment link");
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-1.5 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Copy size={10} />
                    Copy
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
    </>
  );
}
