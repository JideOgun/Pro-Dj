import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientRoleSwitcher from "@/components/ClientRoleSwitcher";
import BookingCalendar from "@/components/BookingCalendar";

export default async function DjDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (session.user.role !== "DJ") {
    redirect("/dashboard");
  }

  // Get DJ profile first
  const djProfile = await prisma.djProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!djProfile) {
    redirect("/dj/register");
  }

  // Get bookings using DjProfile.id
  const bookings = await prisma.booking.findMany({
    where: { djId: djProfile.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      dj: { select: { stageName: true } },
    },
  });

  if (!djProfile) {
    redirect("/dj/register");
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (cents: number | null) => {
    if (!cents) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-900/40 text-yellow-200";
      case "ACCEPTED":
        return "bg-blue-900/40 text-blue-200";
      case "CONFIRMED":
        return "bg-green-900/40 text-green-200";
      case "DECLINED":
        return "bg-red-900/40 text-red-200";
      default:
        return "bg-gray-800 text-gray-200";
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");
  const totalEarnings = bookings
    .filter((b) => b.status === "CONFIRMED" && b.quotedPriceCents)
    .reduce((sum, b) => sum + (b.quotedPriceCents || 0), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Role Switcher */}
        <ClientRoleSwitcher />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {djProfile.stageName}! 🎵
          </h1>
          <p className="text-gray-300">
            Manage your bookings, profile, and earnings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-violet-400">
              {bookings.length}
            </div>
            <div className="text-gray-400">Total Bookings</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-400">
              {pendingBookings.length}
            </div>
            <div className="text-gray-400">Pending Requests</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">
              {confirmedBookings.length}
            </div>
            <div className="text-gray-400">Confirmed Events</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">
              {formatPrice(totalEarnings)}
            </div>
            <div className="text-gray-400">Total Earnings</div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-violet-400">
              Your Profile
            </h2>
            <Link
              href="/dj/profile/edit"
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm"
            >
              Edit Profile
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-300 mb-2">Basic Info</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Stage Name:</span>
                  <span className="ml-2 text-white">{djProfile.stageName}</span>
                </div>
                <div>
                  <span className="text-gray-400">Location:</span>
                  <span className="ml-2 text-white">{djProfile.location}</span>
                </div>
                <div>
                  <span className="text-gray-400">Experience:</span>
                  <span className="ml-2 text-white">
                    {djProfile.experience} years
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Base Rate:</span>
                  <span className="ml-2 text-white">
                    {formatPrice(djProfile.basePriceCents)}/hour
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-300 mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {djProfile.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-violet-900/30 text-violet-200 px-3 py-1 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Calendar */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-8 shadow-2xl border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-violet-400 mb-1">
                📅 Your Booking Calendar
              </h2>
              <p className="text-gray-400 text-sm">
                Interactive calendar with all your DJ bookings
              </p>
            </div>
            <Link
              href="/dashboard/dj/calendar"
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              View Full Calendar →
            </Link>
          </div>
          <div className="h-[400px]">
            <BookingCalendar bookings={bookings} />
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">Declined</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Accepted</span>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-violet-400">
              Recent Bookings
            </h2>
            <Link
              href="/dashboard/bookings"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
            >
              View All
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
              <p className="text-gray-300 mb-4">
                Your booking requests will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="p-3 text-gray-300">Event Date</th>
                    <th className="p-3 text-gray-300">Event Type</th>
                    <th className="p-3 text-gray-300">Client</th>
                    <th className="p-3 text-gray-300">Quote</th>
                    <th className="p-3 text-gray-300">Status</th>
                    <th className="p-3 text-gray-300">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30"
                    >
                      <td className="p-3">
                        <div className="font-medium">
                          {formatDate(booking.eventDate)}
                        </div>
                      </td>
                      <td className="p-3">{booking.eventType}</td>
                      <td className="p-3">
                        {booking.user?.name || booking.user?.email || "-"}
                      </td>
                      <td className="p-3 font-medium">
                        {formatPrice(booking.quotedPriceCents)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-400">
                        {formatDate(booking.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dj/profile/edit"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors"
          >
            <div className="text-3xl mb-2">👤</div>
            <h3 className="font-semibold mb-2">Edit Profile</h3>
            <p className="text-gray-400 text-sm">
              Update your information and pricing
            </p>
          </Link>

          <Link
            href="/dashboard/bookings"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold mb-2">Manage Bookings</h3>
            <p className="text-gray-400 text-sm">
              View and respond to booking requests
            </p>
          </Link>

          <Link
            href="/dashboard/dj/calendar"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors"
          >
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold mb-2">Full Calendar</h3>
            <p className="text-gray-400 text-sm">
              View your complete booking calendar
            </p>
          </Link>

          <Link
            href="/"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors"
          >
            <div className="text-3xl mb-2">🏠</div>
            <h3 className="font-semibold mb-2">Go Home</h3>
            <p className="text-gray-400 text-sm">Return to the homepage</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
