"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Star,
  MessageSquare,
  UserCheck,
  Users,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface BookingInQueue {
  id: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  quotedPriceCents: number;
  message: string;
  details: any;
  selectedAddons: string[];
  status: string;
  createdAt: string;
  priorityScore: number;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  preferredDj?: {
    id: string;
    stageName: string;
    user: { name: string; email: string };
  };
  servicePricing: {
    eventType: string;
    basePricePerHour: number;
    regionMultiplier: number;
    minimumHours: number;
  };
  adminActions: Array<{
    id: string;
    action: string;
    reason?: string;
    createdAt: string;
    admin: { name: string; email: string };
  }>;
}

interface DjSuggestion {
  id: string;
  stageName: string;
  name: string;
  email: string;
  rating: number;
  totalBookings: number;
  isPreferred: boolean;
  score: number;
  scoreBreakdown: {
    baseScore: number;
    clientPreference: number;
    rating: number;
    eventExperience: number;
    recentActivity: number;
    totalExperience: number;
    weekendBonus: number;
  };
}

export default function AdminBookingQueuePage() {
  const { data: session } = useSession();

  // Check admin access
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [bookings, setBookings] = useState<BookingInQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_ADMIN_REVIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingInQueue | null>(
    null
  );
  const [djSuggestions, setDjSuggestions] = useState<DjSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [assigningDj, setAssigningDj] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  // Load bookings
  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/bookings/queue?status=${filter}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // Load DJ suggestions for a booking
  const loadDjSuggestions = async (bookingId: string) => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/admin/bookings/${bookingId}/suggest-djs`
      );
      if (response.ok) {
        const data = await response.json();
        setDjSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Error loading DJ suggestions:", error);
      toast.error("Failed to load DJ suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Assign DJ to booking
  const assignDj = async (bookingId: string, djId: string) => {
    setAssigningDj(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          djId,
          notes: adminNotes,
          action: "ASSIGNED",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedBooking(null);
        setAdminNotes("");
        loadBookings();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign DJ");
      }
    } catch (error) {
      toast.error("Failed to assign DJ");
    } finally {
      setAssigningDj(false);
    }
  };

  // Mark booking for admin review
  const markForReview = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          djId: null,
          notes: adminNotes,
          action: "REVIEWED",
        }),
      });

      if (response.ok) {
        toast.success("Booking marked for review");
        setSelectedBooking(null);
        setAdminNotes("");
        loadBookings();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update booking");
      }
    } catch (error) {
      toast.error("Failed to update booking");
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPriorityColor = (score: number) => {
    if (score >= 70) return "text-red-400 bg-red-900/20";
    if (score >= 40) return "text-orange-400 bg-orange-900/20";
    return "text-green-400 bg-green-900/20";
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.eventType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading booking queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Booking Queue</h1>
          <p className="text-gray-300">
            Review and assign DJs to pending booking requests
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Filter by Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 w-full md:w-auto"
              >
                <option value="PENDING_ADMIN_REVIEW">Pending Review</option>
                <option value="ADMIN_REVIEWING">In Review</option>
                <option value="DJ_ASSIGNED">DJ Assigned</option>
                <option value="CONFIRMED">Confirmed</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Search Bookings
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by client, email, or event type..."
                  className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Queue</p>
                <p className="text-2xl font-bold">{filteredBookings.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-violet-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">High Priority</p>
                <p className="text-2xl font-bold text-red-400">
                  {filteredBookings.filter((b) => b.priorityScore >= 70).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Has Preference</p>
                <p className="text-2xl font-bold text-blue-400">
                  {filteredBookings.filter((b) => b.preferredDj).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatPrice(
                    filteredBookings.reduce(
                      (sum, b) => sum + b.quotedPriceCents,
                      0
                    )
                  )}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
              <h3 className="text-lg font-medium mb-2">No bookings in queue</h3>
              <p className="text-gray-300">
                All bookings for this status have been processed.
              </p>
            </div>
          ) : (
            filteredBookings
              .sort((a, b) => b.priorityScore - a.priorityScore)
              .map((booking) => (
                <div key={booking.id} className="bg-gray-800 rounded-lg p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {booking.eventType}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                            booking.priorityScore
                          )}`}
                        >
                          Priority: {booking.priorityScore}
                        </span>
                        {booking.preferredDj && (
                          <span className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs">
                            Has Preference
                          </span>
                        )}
                        <span className="bg-violet-600 text-violet-100 px-2 py-1 rounded text-xs">
                          {formatPrice(booking.quotedPriceCents)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            {booking.client.name || booking.client.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(booking.eventDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(booking.startTime)} -{" "}
                            {formatTime(booking.endTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedBooking(
                            expandedBooking === booking.id ? null : booking.id
                          )
                        }
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg"
                      >
                        {expandedBooking === booking.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          loadDjSuggestions(booking.id);
                        }}
                        className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        Assign DJ
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedBooking === booking.id && (
                    <div className="border-t border-gray-700 pt-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Event Details</h4>
                          <p className="text-gray-300 text-sm mb-3">
                            {booking.message}
                          </p>

                          {booking.preferredDj && (
                            <div className="mb-3">
                              <h5 className="font-medium text-sm mb-1">
                                Preferred DJ
                              </h5>
                              <p className="text-gray-300 text-sm">
                                {booking.preferredDj.stageName} (
                                {booking.preferredDj.user.name})
                              </p>
                            </div>
                          )}

                          {booking.selectedAddons.length > 0 && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">
                                Selected Add-ons
                              </h5>
                              <p className="text-gray-300 text-sm">
                                {booking.selectedAddons.length} add-ons selected
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">
                            Pricing Breakdown
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Event Type:</span>
                              <span>{booking.servicePricing.eventType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Base Rate:</span>
                              <span>
                                {formatPrice(
                                  booking.servicePricing.basePricePerHour
                                )}
                                /hour
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Min Hours:</span>
                              <span>
                                {booking.servicePricing.minimumHours}h
                              </span>
                            </div>
                            <div className="flex justify-between font-medium pt-2 border-t border-gray-700">
                              <span>Total:</span>
                              <span className="text-violet-400">
                                {formatPrice(booking.quotedPriceCents)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Admin Actions History */}
                      {booking.adminActions.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Admin Actions</h4>
                          <div className="space-y-2">
                            {booking.adminActions.map((action) => (
                              <div
                                key={action.id}
                                className="text-sm bg-gray-700 rounded p-2"
                              >
                                <span className="font-medium">
                                  {action.action}
                                </span>{" "}
                                by {action.admin.name}
                                {action.reason && (
                                  <span className="text-gray-400">
                                    {" "}
                                    - {action.reason}
                                  </span>
                                )}
                                <span className="text-gray-400 text-xs block">
                                  {new Date(action.createdAt).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>

        {/* DJ Assignment Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    Assign DJ - {selectedBooking.eventType}
                  </h3>
                  <p className="text-gray-300">
                    {formatDate(selectedBooking.eventDate)} •{" "}
                    {formatTime(selectedBooking.startTime)} -{" "}
                    {formatTime(selectedBooking.endTime)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Client Preference */}
              {selectedBooking.preferredDj && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <h4 className="font-medium mb-2 text-blue-300">
                    Client's Preferred DJ
                  </h4>
                  <p className="text-gray-300">
                    {selectedBooking.preferredDj.stageName} (
                    {selectedBooking.preferredDj.user.name})
                  </p>
                </div>
              )}

              {/* DJ Suggestions */}
              <div className="mb-6">
                <h4 className="font-medium mb-4">Recommended DJs</h4>
                {loadingSuggestions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Finding best DJ matches...</p>
                  </div>
                ) : djSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
                    <p className="text-gray-300">
                      No available DJs found for this time slot
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {djSuggestions.map((dj, index) => (
                      <div
                        key={dj.id}
                        className={`border rounded-lg p-4 ${
                          dj.isPreferred
                            ? "border-blue-500 bg-blue-900/20"
                            : "border-gray-600 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-violet-600 text-violet-100 px-2 py-1 rounded text-sm font-medium">
                                #{index + 1}
                              </span>
                              <h5 className="font-semibold">{dj.stageName}</h5>
                              {dj.isPreferred && (
                                <span className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs">
                                  Client Preferred
                                </span>
                              )}
                              <span className="text-violet-400 font-medium">
                                Score: {dj.score}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-300">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span>{dj.rating.toFixed(1)}</span>
                              </div>
                              <span>{dj.totalBookings} events</span>
                              <span>{dj.name}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => assignDj(selectedBooking.id, dj.id)}
                            disabled={assigningDj}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
                          >
                            {assigningDj ? "Assigning..." : "Assign"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this assignment..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => markForReview(selectedBooking.id)}
                  className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg"
                >
                  Mark for Review
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
