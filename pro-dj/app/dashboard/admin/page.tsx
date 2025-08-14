import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get comprehensive stats
  const [
    totalUsers,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    totalDjs,
    totalClients,
    recentBookings,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.user.count({ where: { role: "DJ" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        dj: { select: { stageName: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-900/40 text-red-200";
      case "DJ":
        return "bg-violet-900/40 text-violet-200";
      case "CLIENT":
        return "bg-blue-900/40 text-blue-200";
      default:
        return "bg-gray-800 text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-300">Manage your Pro-DJ platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{totalUsers}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <div className="mt-4 flex space-x-2 text-xs">
              <span className="bg-blue-900/30 text-blue-200 px-2 py-1 rounded">
                {totalClients} Clients
              </span>
              <span className="bg-violet-900/30 text-violet-200 px-2 py-1 rounded">
                {totalDjs} DJs
              </span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-white">{totalBookings}</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
            <div className="mt-4 flex space-x-2 text-xs">
              <span className="bg-yellow-900/30 text-yellow-200 px-2 py-1 rounded">
                {pendingBookings} Pending
              </span>
              <span className="bg-green-900/30 text-green-200 px-2 py-1 rounded">
                {confirmedBookings} Confirmed
              </span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">DJs</p>
                <p className="text-2xl font-bold text-violet-400">{totalDjs}</p>
              </div>
              <div className="text-3xl">🎵</div>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/djs"
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                Manage DJs →
              </Link>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Clients</p>
                <p className="text-2xl font-bold text-blue-400">
                  {totalClients}
                </p>
              </div>
              <div className="text-3xl">👤</div>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/clients"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View Clients →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-violet-400 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/bookings"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-semibold mb-1">Manage Bookings</h3>
              <p className="text-gray-400 text-sm">
                View and manage all booking requests
              </p>
            </Link>

            <Link
              href="/dashboard/admin/calendar"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-semibold mb-1">Calendar</h3>
              <p className="text-gray-400 text-sm">
                View upcoming bookings and DJ availability
              </p>
            </Link>

            <Link
              href="/dashboard/pricing"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-semibold mb-1">Pricing</h3>
              <p className="text-gray-400 text-sm">
                Manage platform pricing packages
              </p>
            </Link>

            <Link
              href="/dashboard/media"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🎵</div>
              <h3 className="font-semibold mb-1">Upload Mix</h3>
              <p className="text-gray-400 text-sm">
                Add new music mixes to the platform
              </p>
            </Link>
          </div>
        </div>

        {/* Calendar Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-violet-400">
              Calendar Overview
            </h2>
            <Link
              href="/dashboard/admin/calendar"
              className="text-violet-400 hover:text-violet-300 text-sm"
            >
              View Full Calendar →
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
              <div
                key={day}
                className="text-center text-gray-400 text-xs font-medium py-1"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const dayBookings = recentBookings.filter((booking) => {
                const bookingDate = new Date(booking.eventDate);
                return bookingDate.toDateString() === date.toDateString();
              });

              return (
                <div
                  key={i}
                  className={`h-8 text-xs flex items-center justify-center rounded ${
                    date.toDateString() === new Date().toDateString()
                      ? "bg-violet-600 text-white"
                      : dayBookings.length > 0
                      ? "bg-green-600/30 text-green-200"
                      : "bg-gray-700/50 text-gray-300"
                  }`}
                  title={
                    dayBookings.length > 0
                      ? `${dayBookings.length} booking(s)`
                      : "No bookings"
                  }
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex space-x-4 text-xs text-gray-400">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-violet-600 rounded mr-2"></div>
              Today
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-600/30 rounded mr-2"></div>
              Has Bookings
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-violet-400">
                Recent Bookings
              </h2>
              <Link
                href="/dashboard/bookings"
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                View All →
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📅</div>
                <p>No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {booking.user?.name || booking.user?.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {booking.eventType} • {formatDate(booking.eventDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                      {booking.quotedPriceCents && (
                        <div className="text-xs text-gray-400 mt-1">
                          {formatPrice(booking.quotedPriceCents)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-violet-400">
                Recent Users
              </h2>
              <Link
                href="/dashboard/users"
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                View All →
              </Link>
            </div>

            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">👥</div>
                <p>No users yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        Joined {formatDate(user.createdAt)}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
