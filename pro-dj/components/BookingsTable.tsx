"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Actions from "../app/dashboard/bookings/row-actions";
import { SocketProvider, useSocketContext } from "./SocketProvider";
import SuspendedUserGuard from "./SuspendedUserGuard";
import { Calendar } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  eventType: string;
  eventDate: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
  packageKey?: string | null;
  quotedPriceCents?: number | null;
  checkoutSessionId?: string | null;
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
}

function BookingsTableContent({
  initialBookings,
  userRole,
  userId,
}: BookingsTableProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get WebSocket context
  const { isConnected, socket } = useSocketContext();

  // Listen for real-time booking status changes via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleBookingStatusChange = (data: {
      bookingId: string;
      status: string;
    }) => {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === data.bookingId
            ? { ...booking, status: data.status }
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

  // Helper function to safely handle dates
  const formatDate = (date: string | Date) => {
    try {
      return new Date(date);
    } catch {
      return new Date();
    }
  };

  // Optimistic update when booking status changes
  const updateBookingStatus = (bookingId: string, newStatus: string) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-900/40 text-yellow-200 border-yellow-700/30";
      case "ACCEPTED":
        return "bg-yellow-700/50 text-yellow-200 border-yellow-600/30";
      case "CONFIRMED":
        return "bg-green-700/50 text-green-200 border-green-600/30";
      case "DECLINED":
        return "bg-red-900/40 text-red-200 border-red-700/30";
      default:
        return "bg-gray-800 text-gray-200 border-gray-600/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "PENDING";
      case "ACCEPTED":
        return "NOT PAID";
      case "CONFIRMED":
        return "PAID";
      case "DECLINED":
        return "DECLINED";
      default:
        return status;
    }
  };

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
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-32">
                Client
              </th>
              {userRole === "ADMIN" && (
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-24">
                  DJ
                </th>
              )}
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-20">
                Price
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-300 w-20">
                Status
              </th>
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
                    {new Date(b.eventDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-300 text-sm">
                  {b.startTime && b.endTime ? (
                    <div>
                      {new Date(b.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(b.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                <td className="px-3 py-3 text-gray-300 text-sm">
                  {b.packageKey ?? "-"}
                </td>
                <td className="px-3 py-3">
                  <div className="text-white font-medium text-sm">
                    {b.user?.name || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-400 truncate max-w-[120px]">
                    {b.user?.email}
                  </div>
                </td>
                {userRole === "ADMIN" && (
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
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${getStatusColor(
                      b.status
                    )}`}
                  >
                    {getStatusText(b.status)}
                  </span>
                </td>
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
                      userId={userId}
                      userRole={userRole}
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
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-24">
                Client
              </th>
              {userRole === "ADMIN" && (
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-20">
                  DJ
                </th>
              )}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-16">
                Price
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 w-16">
                Status
              </th>
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
                    {new Date(b.eventDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </td>
                <td className="px-2 py-2 text-gray-300 text-xs">
                  {b.startTime && b.endTime ? (
                    <div>
                      {new Date(b.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(b.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                <td className="px-2 py-2">
                  <div className="text-white font-medium text-xs">
                    {b.user?.name || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-400 truncate max-w-[80px]">
                    {b.user?.email}
                  </div>
                </td>
                {userRole === "ADMIN" && (
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
                  <span
                    className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${getStatusColor(
                      b.status
                    )}`}
                  >
                    {getStatusText(b.status)}
                  </span>
                </td>
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
                      userId={userId}
                      userRole={userRole}
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
                  {new Date(b.eventDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {b.startTime && b.endTime && (
                  <div className="text-sm text-gray-400">
                    {new Date(b.startTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(b.endTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                  b.status
                )}`}
              >
                {getStatusText(b.status)}
              </span>
            </div>

            {/* Event Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-violet-900/30 text-violet-200 border border-violet-700/30">
                  {b.eventType}
                </span>
                {b.packageKey && (
                  <span className="text-sm text-gray-300">
                    • {b.packageKey}
                  </span>
                )}
              </div>

              {b.quotedPriceCents && (
                <div className="text-sm">
                  <span className="text-gray-400">Price: </span>
                  <span className="font-semibold text-green-400">
                    ${(b.quotedPriceCents / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Client and DJ Info */}
            <div className="space-y-2 mb-4">
              <div>
                <div className="text-sm text-gray-400">Client</div>
                <div className="text-white font-medium">
                  {b.user?.name || "Unknown"}
                </div>
                <div className="text-xs text-gray-400">{b.user?.email}</div>
              </div>

              {userRole === "ADMIN" && (
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
              )}
            </div>

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
                  userId={userId}
                  userRole={userRole}
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
