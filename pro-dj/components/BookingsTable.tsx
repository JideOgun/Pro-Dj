"use client";

import { useState, useEffect } from "react";
import Actions from "../app/dashboard/bookings/row-actions";
import { SocketProvider, useSocketContext } from "./SocketProvider";
import SuspendedUserGuard from "./SuspendedUserGuard";
import { Calendar, Clock } from "lucide-react";
import {
  getStatusColor,
  getStatusText,
  getPaymentStatusText,
  getStatusIcon,
  getPaymentStatusIcon,
  getDjPaymentStatusText,
  getDjPaymentStatusColor,
  getDjPaymentStatusIcon,
  getClientPaymentStatusText,
  getClientPaymentStatusColor,
  getClientPaymentStatusIcon,
} from "@/lib/status-utils";

interface Booking {
  id: string;
  status: string;
  eventType: string;
  eventDate: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
  quotedPriceCents?: number | null;
  checkoutSessionId?: string | null;
  isPaid?: boolean;
  paidAt?: string | Date | null;
  refundId?: string | null;
  refundedAt?: string | Date | null;
  message?: string;
  details?:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | unknown[]
    | null;
  createdAt: string | Date;
  user?: {
    name?: string | null;
    email?: string;
  };
  dj?: {
    stageName?: string;
  } | null;
}

interface BookingsTableProps {
  initialBookings: Booking[];
  userRole: string;
  userId?: string;
  view?: string;
}

function BookingsTableContent({
  initialBookings,
  userRole,
  userId,
  view,
}: BookingsTableProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isClient, setIsClient] = useState(false);

  // Get WebSocket context
  const { isConnected, socket } = useSocketContext();

  // Ensure we're on the client side to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen for real-time booking status changes via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleBookingStatusChange = (data: {
      bookingId: string;
      status: string;
      isPaid?: boolean;
    }) => {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === data.bookingId
            ? {
                ...booking,
                status: data.status,
                isPaid:
                  data.isPaid !== undefined ? data.isPaid : booking.isPaid,
              }
            : booking
        )
      );
    };

    // Set up WebSocket listener
    socket.on("booking-status-changed", handleBookingStatusChange);

    // Cleanup listener on unmount
    return () => {
      socket.off("booking-status-changed", handleBookingStatusChange);
    };
  }, [socket, isConnected]);

  // Helper function to format date for display (client-side only)
  const formatDateForDisplay = (date: string | Date) => {
    if (!isClient) return ""; // Return empty string during SSR
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Helper function to format time for display (client-side only)
  const formatTimeForDisplay = (date: string | Date) => {
    if (!isClient) return ""; // Return empty string during SSR
    try {
      return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Helper function to calculate timeout information (client-side only)
  const getTimeoutInfo = (
    createdAt: string | Date,
    eventDate: string | Date
  ) => {
    if (!isClient) {
      return {
        isExpired: false,
        timeLeftFormatted: "",
        color: "text-gray-400",
      };
    }

    const created = new Date(createdAt);
    const event = new Date(eventDate);
    const now = new Date();

    // Calculate days until event
    const daysUntilEvent = Math.ceil(
      (event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine timeout hours based on event proximity
    const timeoutHours = daysUntilEvent <= 7 ? 24 : 48;
    const timeoutDate = new Date(
      created.getTime() + timeoutHours * 60 * 60 * 1000
    );
    const timeLeft = timeoutDate.getTime() - now.getTime();

    if (timeLeft <= 0) {
      return {
        isExpired: true,
        timeLeftFormatted: "Expired",
        color: "text-red-400",
      };
    }

    const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
    const daysLeft = Math.ceil(hoursLeft / 24);

    let color = "text-green-400";
    if (hoursLeft <= 6) color = "text-red-400";
    else if (hoursLeft <= 24) color = "text-yellow-400";

    return {
      isExpired: false,
      timeLeftFormatted:
        daysLeft > 1 ? `${daysLeft} days` : `${hoursLeft} hours`,
      color,
    };
  };

  // Optimistic update when booking status changes
  const updateBookingStatus = (bookingId: string, newStatus: string) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      )
    );
  };

  // Using centralized status utilities from lib/status-utils.ts

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden w-full">
      {/* WebSocket connection indicator */}
      <div
        className={`border-b px-6 py-2 ${
          isConnected
            ? "bg-green-900/20 border-green-500/30"
            : "bg-yellow-900/20 border-yellow-500/30"
        }`}
      >
        <div className="flex items-center gap-2 text-sm">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-400" : "bg-yellow-400"
            }`}
          ></div>
          {isConnected
            ? "Real-time updates connected"
            : "Connecting to real-time updates..."}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden xl:block overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="bg-gray-700/50">
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-24">
                Date
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-20">
                Time
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-24">
                Event
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-20">
                Package
              </th>
              {userRole !== "CLIENT" && (
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-32">
                  Client
                </th>
              )}
              {(userRole === "ADMIN" || userRole === "CLIENT") && (
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-24">
                  DJ
                </th>
              )}
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-20">
                Price
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-20">
                {userRole === "CLIENT" ? "Payment Status" : "Status"}
              </th>
              {(userRole === "DJ" ||
                (userRole === "ADMIN" && view === "dj")) && (
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-24">
                  Payment Status
                </th>
              )}
              <th className="px-3 py-3 text-right text-sm font-medium text-gray-300 w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="px-3 py-3">
                  <div className="text-white font-medium text-sm">
                    {formatDateForDisplay(b.eventDate)}
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-300 text-sm">
                  {b.startTime && b.endTime ? (
                    <div>
                      {formatTimeForDisplay(b.startTime)} -{" "}
                      {formatTimeForDisplay(b.endTime)}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-violet-900/30 text-violet-200 border border-violet-700/30 whitespace-nowrap">
                    {b.eventType}
                  </span>
                </td>

                {userRole !== "CLIENT" && (
                  <td className="px-3 py-3">
                    <div className="text-white font-medium text-sm">
                      {b.user?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-400 truncate max-w-[120px]">
                      {b.user?.email}
                    </div>
                  </td>
                )}
                {(userRole === "ADMIN" || userRole === "CLIENT") && (
                  <td className="px-3 py-3">
                    {b.dj?.stageName ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-200 border border-blue-700/30 whitespace-nowrap">
                        {b.dj.stageName}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Unassigned</span>
                    )}
                  </td>
                )}
                <td className="px-3 py-3">
                  {b.quotedPriceCents ? (
                    <span className="font-semibold text-green-400 text-sm">
                      ${(b.quotedPriceCents / 100).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${
                      userRole === "CLIENT"
                        ? getClientPaymentStatusColor(b.status, b.refundId)
                        : getStatusColor(b.status)
                    }`}
                  >
                    <span>
                      {userRole === "CLIENT"
                        ? getClientPaymentStatusIcon(b.status, b.refundId)
                        : getStatusIcon(b.status)}
                    </span>
                    {userRole === "CLIENT"
                      ? getClientPaymentStatusText(b.status, b.refundId)
                      : getStatusText(b.status)}
                  </span>
                </td>
                {(userRole === "DJ" ||
                  (userRole === "ADMIN" && view === "dj")) && (
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${getDjPaymentStatusColor(
                        b.isPaid || false,
                        b.refundId
                      )}`}
                    >
                      <span>
                        {getDjPaymentStatusIcon(b.isPaid || false, b.refundId)}
                      </span>
                      {getDjPaymentStatusText(b.isPaid || false, b.refundId)}
                    </span>
                  </td>
                )}
                <td className="px-3 py-3 text-right">
                  <SuspendedUserGuard
                    fallback={
                      <span className="text-gray-400 text-xs">
                        Actions disabled
                      </span>
                    }
                  >
                    <Actions
                      id={b.id}
                      status={b.status}
                      checkoutSessionId={b.checkoutSessionId}
                      onStatusChange={updateBookingStatus}
                      userRole={userRole}
                      isPaid={b.isPaid}
                      quotedPriceCents={b.quotedPriceCents}
                      refundId={b.refundId}
                      eventDate={b.eventDate}
                      eventType={b.eventType}
                      startTime={b.startTime}
                      endTime={b.endTime}
                      message={b.message}
                      details={b.details}
                      onRefresh={() => {
                        // Refresh bookings after refund
                        setBookings(initialBookings);
                      }}
                    />
                  </SuspendedUserGuard>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet Table */}
      <div className="hidden lg:block xl:hidden overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-700/50">
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-20">
                Date
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-16">
                Time
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-20">
                Event
              </th>
              {userRole !== "CLIENT" && (
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-24">
                  Client
                </th>
              )}
              {(userRole === "ADMIN" || userRole === "CLIENT") && (
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-20">
                  DJ
                </th>
              )}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-16">
                Price
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-16">
                {userRole === "CLIENT" ? "Payment Status" : "Status"}
              </th>
              {(userRole === "DJ" ||
                (userRole === "ADMIN" && view === "dj")) && (
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-20">
                  Payment
                </th>
              )}
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-300 w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="px-2 py-2">
                  <div className="text-white font-medium text-xs">
                    {formatDateForDisplay(b.eventDate)}
                  </div>
                </td>
                <td className="px-2 py-2 text-gray-300 text-xs">
                  {b.startTime && b.endTime ? (
                    <div>
                      {formatTimeForDisplay(b.startTime)} -{" "}
                      {formatTimeForDisplay(b.endTime)}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-violet-900/30 text-violet-200 border border-violet-700/30 whitespace-nowrap">
                    {b.eventType}
                  </span>
                </td>
                {userRole !== "CLIENT" && (
                  <td className="px-2 py-2">
                    <div className="text-white font-medium text-xs">
                      {b.user?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-400 truncate max-w-[80px]">
                      {b.user?.email}
                    </div>
                  </td>
                )}
                {(userRole === "ADMIN" || userRole === "CLIENT") && (
                  <td className="px-2 py-2">
                    {b.dj?.stageName ? (
                      <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-200 border border-blue-700/30 whitespace-nowrap">
                        {b.dj.stageName}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Unassigned</span>
                    )}
                  </td>
                )}
                <td className="px-2 py-2">
                  {b.quotedPriceCents ? (
                    <span className="font-semibold text-green-400 text-xs">
                      ${(b.quotedPriceCents / 100).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${getStatusColor(
                        b.status
                      )}`}
                    >
                      {userRole === "CLIENT"
                        ? getPaymentStatusText(b.status)
                        : getStatusText(b.status)}
                    </span>
                    {b.status === "PENDING" && b.createdAt && (
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        <span
                          className={
                            getTimeoutInfo(b.createdAt, b.eventDate).color
                          }
                        >
                          {
                            getTimeoutInfo(b.createdAt, b.eventDate)
                              .timeLeftFormatted
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                {(userRole === "DJ" ||
                  (userRole === "ADMIN" && view === "dj")) && (
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex items-center gap-1 px-1 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${getDjPaymentStatusColor(
                        b.isPaid || false
                      )}`}
                    >
                      <span>{getDjPaymentStatusIcon(b.isPaid || false)}</span>
                      {getDjPaymentStatusText(b.isPaid || false)}
                    </span>
                  </td>
                )}
                <td className="px-2 py-2 text-right">
                  <SuspendedUserGuard
                    fallback={
                      <span className="text-gray-400 text-xs">
                        Actions disabled
                      </span>
                    }
                  >
                    <Actions
                      id={b.id}
                      status={b.status}
                      checkoutSessionId={b.checkoutSessionId}
                      onStatusChange={updateBookingStatus}
                      userRole={userRole}
                      isPaid={b.isPaid}
                      quotedPriceCents={b.quotedPriceCents}
                      refundId={b.refundId}
                      eventDate={b.eventDate}
                      eventType={b.eventType}
                      startTime={b.startTime}
                      endTime={b.endTime}
                      message={b.message}
                      details={b.details}
                      onRefresh={() => {
                        // Refresh bookings after refund
                        setBookings(initialBookings);
                      }}
                    />
                  </SuspendedUserGuard>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30"
          >
            {/* Header with Date and Status */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-white font-medium">
                  {isClient
                    ? new Date(b.eventDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </div>
                {b.startTime && b.endTime && (
                  <div className="text-sm text-gray-400">
                    {formatTimeForDisplay(b.startTime)} -{" "}
                    {formatTimeForDisplay(b.endTime)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                    userRole === "CLIENT"
                      ? getClientPaymentStatusColor(b.status, b.refundId)
                      : getStatusColor(b.status)
                  }`}
                >
                  <span>
                    {userRole === "CLIENT"
                      ? getClientPaymentStatusIcon(b.status, b.refundId)
                      : getStatusIcon(b.status)}
                  </span>
                  {userRole === "CLIENT"
                    ? getClientPaymentStatusText(b.status, b.refundId)
                    : getStatusText(b.status)}
                </span>
                {b.status === "PENDING" && b.createdAt && (
                  <div className="flex items-center justify-end gap-1 text-xs mt-1">
                    <Clock className="w-3 h-3" />
                    <span
                      className={getTimeoutInfo(b.createdAt, b.eventDate).color}
                    >
                      {
                        getTimeoutInfo(b.createdAt, b.eventDate)
                          .timeLeftFormatted
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-violet-900/30 text-violet-200 border border-violet-700/30">
                  {b.eventType}
                </span>
              </div>

              {b.quotedPriceCents && (
                <div className="text-sm">
                  <span className="text-gray-400">Price: </span>
                  <span className="font-semibold text-green-400">
                    ${(b.quotedPriceCents / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {(userRole === "DJ" ||
                (userRole === "ADMIN" && view === "dj")) && (
                <div className="text-sm">
                  <span className="text-gray-400">Payment: </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getDjPaymentStatusColor(
                      b.isPaid || false,
                      b.refundId
                    )}`}
                  >
                    <span>
                      {getDjPaymentStatusIcon(b.isPaid || false, b.refundId)}
                    </span>
                    {getDjPaymentStatusText(b.isPaid || false, b.refundId)}
                  </span>
                </div>
              )}
            </div>

            {/* DJ Info */}
            {(userRole === "ADMIN" || userRole === "CLIENT") && (
              <div className="space-y-2 mb-4">
                {userRole !== "CLIENT" && (
                  <div>
                    <div className="text-sm text-gray-400">Client</div>
                    <div className="text-white font-medium">
                      {b.user?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-400">{b.user?.email}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-400">DJ</div>
                  {b.dj?.stageName ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-200 border border-blue-700/30">
                      {b.dj.stageName}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Unassigned</span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-gray-600/30">
              <SuspendedUserGuard
                fallback={
                  <span className="text-gray-400 text-xs">
                    Actions disabled
                  </span>
                }
              >
                <Actions
                  id={b.id}
                  status={b.status}
                  checkoutSessionId={b.checkoutSessionId}
                  onStatusChange={updateBookingStatus}
                  userRole={userRole}
                  isPaid={b.isPaid}
                  quotedPriceCents={b.quotedPriceCents}
                  refundId={b.refundId}
                  eventDate={b.eventDate}
                  eventType={b.eventType}
                  startTime={b.startTime}
                  endTime={b.endTime}
                  message={b.message}
                  details={b.details}
                  onRefresh={() => {
                    // Refresh bookings after refund
                    setBookings(initialBookings);
                  }}
                />
              </SuspendedUserGuard>
            </div>
          </div>
        ))}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mb-4 mx-auto" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-300">
            {userRole === "ADMIN" ? "No bookings found" : "No bookings yet"}
          </h3>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            {userRole === "ADMIN"
              ? "Bookings will appear here when clients make requests"
              : "Your booking requests will appear here"}
          </p>
        </div>
      )}
    </div>
  );
}

// Wrapper component that provides Socket context
export default function BookingsTable(props: BookingsTableProps) {
  return (
    <SocketProvider userId={props.userId} role={props.userRole}>
      <BookingsTableContent {...props} />
    </SocketProvider>
  );
}
