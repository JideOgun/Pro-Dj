import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import EarningsCharts from "@/components/EarningsCharts";
import PaymentAnalytics from "@/components/PaymentAnalytics";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get DJ profile (only for DJ users)
  let djProfile = null;
  if (session.user.role === "DJ") {
    djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile) {
      redirect("/dj/register");
    }
  }

  // Build where clause for bookings
  const bookingWhereClause =
    session.user.role === "DJ" ? { djId: djProfile!.id } : {}; // For admins, get all bookings

  // Get all confirmed bookings for earnings calculations
  const confirmedBookings = await prisma.booking.findMany({
    where: {
      ...bookingWhereClause,
      status: "CONFIRMED",
    },
    orderBy: { eventDate: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      dj: { select: { stageName: true } },
    },
  });

  // Get all bookings for trends
  const allBookings = await prisma.booking.findMany({
    where: bookingWhereClause,
    orderBy: { createdAt: "asc" },
    include: {
      dj: { select: { stageName: true } },
    },
  });

  // Calculate earnings statistics
  const totalEarnings = confirmedBookings.reduce(
    (sum, booking) => sum + (booking.quotedPriceCents || 0),
    0
  );

  const totalBookings = allBookings.length;
  const confirmedBookingsCount = confirmedBookings.length;
  const averageEarningsPerBooking =
    confirmedBookingsCount > 0 ? totalEarnings / confirmedBookingsCount : 0;

  // Calculate monthly earnings for the last 12 months
  const monthlyEarnings = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthBookings = confirmedBookings.filter((booking) => {
      const bookingDate = new Date(booking.eventDate);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    });

    const monthEarnings = monthBookings.reduce(
      (sum, booking) => sum + (booking.quotedPriceCents || 0),
      0
    );

    monthlyEarnings.push({
      month: date.toLocaleDateString("en-US", { month: "short" }),
      earnings: monthEarnings / 100, // Convert cents to dollars
      bookings: monthBookings.length,
    });
  }

  // Calculate booking trends (last 6 months)
  const bookingTrends = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthBookings = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    });

    const pendingBookings = monthBookings.filter(
      (b) => b.status === "PENDING_ADMIN_REVIEW"
    ).length;
    const acceptedBookings = monthBookings.filter(
      (b) => b.status === "DJ_ASSIGNED"
    ).length;
    const confirmedBookings = monthBookings.filter(
      (b) => b.status === "CONFIRMED"
    ).length;
    const declinedBookings = monthBookings.filter(
      (b) => b.status === "CANCELLED"
    ).length;

    bookingTrends.push({
      month: date.toLocaleDateString("en-US", { month: "short" }),
      pending: pendingBookings,
      accepted: acceptedBookings,
      confirmed: confirmedBookings,
      declined: declinedBookings,
    });
  }

  // Get recent earnings (last 10 confirmed bookings)
  const recentEarnings = confirmedBookings
    .slice(-10)
    .reverse()
    .map((booking) => ({
      id: booking.id,
      eventDate: booking.eventDate,
      eventType: booking.eventType,
      clientName: booking.user.name || booking.user.email,
      djName: booking.dj?.stageName || "Unknown DJ",
      amount: booking.quotedPriceCents ? booking.quotedPriceCents / 100 : 0,
      duration: Math.round(
        (new Date(booking.endTime).getTime() -
          new Date(booking.startTime).getTime()) /
          (1000 * 60 * 60)
      ),
    }));

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-400" />
                Earnings Dashboard
              </h1>
              <p className="text-gray-300">
                Track your earnings, booking trends, and financial performance
              </p>
            </div>
            <Link
              href="/dashboard/dj"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {formatPrice(totalEarnings)}
                </div>
                <div className="text-gray-300 text-sm">Total Earnings</div>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatPrice(averageEarningsPerBooking)}
                </div>
                <div className="text-gray-300 text-sm">Avg. per Booking</div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-900/30 to-violet-800/30 border border-violet-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-violet-400">
                  {confirmedBookingsCount}
                </div>
                <div className="text-gray-300 text-sm">Confirmed Events</div>
              </div>
              <Calendar className="w-8 h-8 text-violet-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {totalBookings}
                </div>
                <div className="text-gray-300 text-sm">Total Bookings</div>
              </div>
              <Users className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Earnings Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-violet-400">
              Monthly Earnings
            </h3>
            <EarningsCharts
              monthlyEarnings={monthlyEarnings}
              bookingTrends={bookingTrends}
              chartType="earnings"
            />
          </div>

          {/* Booking Trends Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">
              Booking Trends
            </h3>
            <EarningsCharts
              monthlyEarnings={monthlyEarnings}
              bookingTrends={bookingTrends}
              chartType="trends"
            />
          </div>
        </div>

        {/* Payment Analytics Section */}
        <div className="mb-8">
          <PaymentAnalytics />
        </div>

        {/* Recent Earnings Table */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-green-400">
            Recent Earnings
          </h3>
          {recentEarnings.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
              <h4 className="text-lg font-medium mb-2">No earnings yet</h4>
              <p className="text-gray-300">
                Your earnings will appear here once you have confirmed bookings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="p-3 text-gray-300">Event Date</th>
                    <th className="p-3 text-gray-300">Event Type</th>
                    {session.user.role === "ADMIN" && (
                      <th className="p-3 text-gray-300">DJ</th>
                    )}
                    <th className="p-3 text-gray-300">Client</th>
                    <th className="p-3 text-gray-300">Duration</th>
                    <th className="p-3 text-gray-300">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEarnings.map((earning) => (
                    <tr
                      key={earning.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30"
                    >
                      <td className="p-3">
                        <div className="font-medium">
                          {new Date(earning.eventDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                      </td>
                      <td className="p-3">{earning.eventType}</td>
                      {session.user.role === "ADMIN" && (
                        <td className="p-3">
                          <div className="font-medium text-blue-300">
                            {earning.djName}
                          </div>
                        </td>
                      )}
                      <td className="p-3">
                        <div className="font-medium text-violet-300">
                          {earning.clientName}
                        </div>
                      </td>
                      <td className="p-3">{earning.duration}h</td>
                      <td className="p-3 font-medium text-green-400">
                        ${earning.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
