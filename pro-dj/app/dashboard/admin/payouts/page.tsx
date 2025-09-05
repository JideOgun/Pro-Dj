"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import {
  DollarSign,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  CreditCard,
  TrendingUp,
  Users,
  Filter,
  Search,
} from "lucide-react";

interface PayoutBooking {
  id: string;
  status: string;
  payoutStatus: string;
  payoutAmountCents: number | null;
  payoutAt: string | null;
  payoutId: string | null;
  suggestedPayoutAmount: number;
  platformFee: number;
  canProcessPayout: boolean;
  isPaid: boolean;
  dj: {
    id: string;
    name: string;
    email: string;
    hasStripeConnect: boolean;
    contractorStatus: string;
    splitPercentage: number;
  } | null;
  client: {
    name: string;
    email: string;
  };
  eventDetails: {
    type: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    totalAmount: number;
    totalAmountFormatted: string;
    addons: Array<{
      name: string;
      priceFixed: number | null;
      pricePerHour: number | null;
      priceFormatted: string;
    }>;
  };
  lastPayoutAction: any;
  createdAt: string;
}

interface PayoutSummary {
  total: number;
  pending: number;
  completed: number;
  totalPendingAmount: number;
  totalCompletedAmount: number;
  totalPlatformRevenue: number;
  totalPendingAmountFormatted: string;
  totalCompletedAmountFormatted: string;
  totalPlatformRevenueFormatted: string;
}

export default function AdminPayoutsPage() {
  const { data: session } = useSession();

  // Check admin access
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [bookings, setBookings] = useState<PayoutBooking[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, completed
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<PayoutBooking | null>(
    null
  );
  const [processingPayout, setProcessingPayout] = useState(false);
  const [customPayoutAmount, setCustomPayoutAmount] = useState("");
  const [customPayoutPercentage, setCustomPayoutPercentage] = useState("");

  // Load payout data
  useEffect(() => {
    loadPayoutData();
  }, [filter]);

  const loadPayoutData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/payouts?status=${filter}&limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setBookings(data.data.bookings || []);
        setSummary(data.data.summary);
      } else {
        toast.error("Failed to load payout data");
      }
    } catch (error) {
      console.error("Error loading payout data:", error);
      toast.error("Failed to load payout data");
    } finally {
      setLoading(false);
    }
  };

  const processPayout = async (
    bookingId: string,
    payoutAmount?: number,
    payoutPercentage?: number
  ) => {
    setProcessingPayout(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutAmountCents: payoutAmount,
          payoutPercentage: payoutPercentage,
          adminNotes: `Manual payout processed by admin${
            payoutPercentage ? ` with ${payoutPercentage}% split` : ""
          }`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedBooking(null);
        setCustomPayoutAmount("");
        setCustomPayoutPercentage("");
        loadPayoutData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process payout");
      }
    } catch (error) {
      console.error("Error processing payout:", error);
      toast.error("Failed to process payout");
    } finally {
      setProcessingPayout(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.dj?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.eventDetails.type
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading payout data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">DJ Payout Management</h1>
          <p className="text-gray-300">
            Manage manual payouts to DJs for completed bookings
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Pending Payouts</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.pending}
                  </p>
                  <p className="text-blue-100 text-sm">
                    {summary.totalPendingAmountFormatted}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-100" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Completed Payouts</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.completed}
                  </p>
                  <p className="text-green-100 text-sm">
                    {summary.totalCompletedAmountFormatted}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-100" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Platform Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.totalPlatformRevenueFormatted}
                  </p>
                  <p className="text-purple-100 text-sm">
                    From {summary.total} bookings
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-100" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Bookings</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.total}
                  </p>
                  <p className="text-orange-100 text-sm">With assigned DJs</p>
                </div>
                <Users className="w-8 h-8 text-orange-100" />
              </div>
            </div>
          </div>
        )}

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
                <option value="all">All Bookings</option>
                <option value="pending">Pending Payouts</option>
                <option value="completed">Completed Payouts</option>
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
                  placeholder="Search by DJ, client, or event type..."
                  className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
              <h3 className="text-lg font-medium mb-2">No bookings found</h3>
              <p className="text-gray-300">
                {filter === "pending"
                  ? "No pending payouts at this time."
                  : filter === "completed"
                  ? "No completed payouts yet."
                  : "No bookings with assigned DJs found."}
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">
                        {booking.eventDetails.type}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.payoutStatus === "COMPLETED"
                            ? "bg-green-900/30 text-green-200"
                            : "bg-yellow-900/30 text-yellow-200"
                        }`}
                      >
                        {booking.payoutStatus === "COMPLETED"
                          ? "Paid Out"
                          : "Pending"}
                      </span>
                      <span className="bg-violet-600 text-violet-100 px-2 py-1 rounded text-xs">
                        {booking.eventDetails.totalAmountFormatted}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.isPaid
                            ? "bg-green-900/30 text-green-200"
                            : "bg-red-900/30 text-red-200"
                        }`}
                      >
                        {booking.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          <strong>DJ:</strong>{" "}
                          {booking.dj?.name || "No DJ assigned"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.eventDetails.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(booking.eventDetails.startTime)} -{" "}
                          {formatTime(booking.eventDetails.endTime)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Client:</span>{" "}
                        {booking.client.name}
                      </div>
                      <div>
                        <span className="text-gray-400">DJ Split:</span>{" "}
                        {booking.dj?.splitPercentage || 30}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {booking.canProcessPayout && (
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Process Payout
                      </button>
                    )}
                  </div>
                </div>

                {/* Payout Information */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Suggested Payout:</span>
                      <span className="ml-2 font-medium">
                        ${(booking.suggestedPayoutAmount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Platform Fee:</span>
                      <span className="ml-2 font-medium">
                        ${(booking.platformFee / 100).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Stripe Connect:</span>
                      <span
                        className={`ml-2 ${
                          booking.dj?.hasStripeConnect
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {booking.dj?.hasStripeConnect ? "Ready" : "Not Set Up"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payout Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {selectedBooking.payoutStatus === "COMPLETED"
                      ? "Payout Details"
                      : "Process Payout"}
                  </h3>
                  <p className="text-gray-300">
                    {selectedBooking.eventDetails.type} •{" "}
                    {formatDate(selectedBooking.eventDetails.date)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setCustomPayoutAmount("");
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3">Event Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Type:</span>{" "}
                      {selectedBooking.eventDetails.type}
                    </div>
                    <div>
                      <span className="text-gray-400">Date:</span>{" "}
                      {formatDate(selectedBooking.eventDetails.date)}
                    </div>
                    <div>
                      <span className="text-gray-400">Time:</span>{" "}
                      {formatTime(selectedBooking.eventDetails.startTime)} -{" "}
                      {formatTime(selectedBooking.eventDetails.endTime)}
                    </div>
                    <div>
                      <span className="text-gray-400">Total Amount:</span>{" "}
                      {selectedBooking.eventDetails.totalAmountFormatted}
                    </div>
                    <div>
                      <span className="text-gray-400">Payment Status:</span>{" "}
                      <span
                        className={`font-medium ${
                          selectedBooking.isPaid
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {selectedBooking.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">People</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Client:</span>{" "}
                      {selectedBooking.client.name}
                    </div>
                    <div>
                      <span className="text-gray-400">DJ:</span>{" "}
                      {selectedBooking.dj?.name}
                    </div>
                    <div>
                      <span className="text-gray-400">DJ Email:</span>{" "}
                      {selectedBooking.dj?.email}
                    </div>
                    <div>
                      <span className="text-gray-400">Split:</span>{" "}
                      {selectedBooking.dj?.splitPercentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {selectedBooking.eventDetails.addons.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Selected Add-ons</h4>
                  <div className="space-y-1">
                    {selectedBooking.eventDetails.addons.map((addon, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{addon.name}</span>
                        <span>{addon.priceFormatted}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payout Information */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-3">Payout Calculation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Booking Amount:</span>
                    <span>
                      {selectedBooking.eventDetails.totalAmountFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      DJ Split ({selectedBooking.dj?.splitPercentage}%):
                    </span>
                    <span>
                      $
                      {(selectedBooking.suggestedPayoutAmount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span>
                      ${(selectedBooking.platformFee / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 flex justify-between font-medium">
                    <span>Suggested Payout:</span>
                    <span className="text-green-400">
                      $
                      {(selectedBooking.suggestedPayoutAmount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payout Adjustment Section */}
              {selectedBooking.canProcessPayout && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Adjust Payout</h4>

                  {/* Percentage Adjustment */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      DJ Payout Percentage
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={customPayoutPercentage}
                        onChange={(e) => {
                          setCustomPayoutPercentage(e.target.value);
                          if (e.target.value) {
                            const percentage = parseFloat(e.target.value);
                            const amount =
                              (selectedBooking.eventDetails.totalAmount *
                                percentage) /
                              100;
                            setCustomPayoutAmount((amount / 100).toFixed(2));
                          }
                        }}
                        placeholder={
                          selectedBooking.dj?.splitPercentage?.toString() ||
                          "30"
                        }
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 w-24"
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <span className="text-gray-400">%</span>
                      <span className="text-sm text-gray-400">
                        (Default: {selectedBooking.dj?.splitPercentage || 30}%)
                      </span>
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Custom Payout Amount (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        value={customPayoutAmount}
                        onChange={(e) => {
                          setCustomPayoutAmount(e.target.value);
                          if (e.target.value) {
                            const amount = parseFloat(e.target.value);
                            const percentage =
                              (amount /
                                (selectedBooking.eventDetails.totalAmount /
                                  100)) *
                              100;
                            setCustomPayoutPercentage(percentage.toFixed(1));
                          }
                        }}
                        placeholder={(
                          selectedBooking.suggestedPayoutAmount / 100
                        ).toFixed(2)}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 flex-1"
                        step="0.01"
                        min="0"
                        max={selectedBooking.eventDetails.totalAmount / 100}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Leave empty to use suggested amount: $
                      {(selectedBooking.suggestedPayoutAmount / 100).toFixed(2)}
                    </p>
                  </div>

                  {/* Calculated Summary */}
                  {(customPayoutPercentage || customPayoutAmount) && (
                    <div className="bg-blue-900/30 border border-blue-700/30 rounded-lg p-3">
                      <h5 className="font-medium text-blue-200 mb-2">
                        Adjusted Payout Summary
                      </h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Booking:</span>
                          <span>
                            {selectedBooking.eventDetails.totalAmountFormatted}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>DJ Percentage:</span>
                          <span>
                            {customPayoutPercentage ||
                              selectedBooking.dj?.splitPercentage ||
                              30}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>DJ Payout:</span>
                          <span className="text-green-400">
                            $
                            {customPayoutAmount ||
                              (
                                selectedBooking.suggestedPayoutAmount / 100
                              ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee:</span>
                          <span className="text-purple-400">
                            $
                            {(
                              (selectedBooking.eventDetails.totalAmount -
                                parseFloat(
                                  customPayoutAmount ||
                                    (
                                      selectedBooking.suggestedPayoutAmount /
                                      100
                                    ).toFixed(2)
                                ) *
                                  100) /
                              100
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Status Warning */}
              {!selectedBooking.isPaid && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 text-red-200 border border-red-700/30">
                    <AlertCircle className="w-5 h-5" />
                    <span>
                      <strong>Warning:</strong> Client has not paid for this
                      booking yet. Payouts can only be processed after the
                      client has paid the full amount.
                    </span>
                  </div>
                </div>
              )}

              {/* Stripe Connect Status */}
              <div className="mb-6">
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    selectedBooking.dj?.hasStripeConnect
                      ? "bg-green-900/30 text-green-200 border border-green-700/30"
                      : "bg-red-900/30 text-red-200 border border-red-700/30"
                  }`}
                >
                  {selectedBooking.dj?.hasStripeConnect ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>
                    {selectedBooking.dj?.hasStripeConnect
                      ? "DJ has Stripe Connect account set up - ready for payout"
                      : "DJ needs to set up Stripe Connect account before payout"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setCustomPayoutAmount("");
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>

                {selectedBooking.canProcessPayout && selectedBooking.isPaid && (
                  <button
                    onClick={() => {
                      const amount = customPayoutAmount
                        ? Math.round(parseFloat(customPayoutAmount) * 100)
                        : selectedBooking.suggestedPayoutAmount;
                      const percentage = customPayoutPercentage
                        ? parseFloat(customPayoutPercentage)
                        : undefined;
                      processPayout(selectedBooking.id, amount, percentage);
                    }}
                    disabled={processingPayout}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg flex items-center gap-2"
                  >
                    {processingPayout ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Process Payout
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
