import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import BookingCalendar from "@/components/BookingCalendar";
import TimeoutManagement from "@/components/TimeoutManagement";
import AutomatedTimeoutProcessor from "@/components/AutomatedTimeoutProcessor";
import { hasAdminPrivileges } from "@/lib/auth-utils";
import { getDisplayName } from "@/lib/user-utils";
import {
  Users,
  Calendar,
  Music,
  User,
  ClipboardList,
  DollarSign,
  ArrowRight,
  Crown,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasAdminPrivileges(session.user)) {
    redirect("/dashboard");
  }

  // Get user with profile data for display name and profile picture
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      djProfile: {
        select: { stageName: true },
      },
      userMedia: {
        where: { type: "PROFILE_PICTURE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Get proper display name for admin
  const displayName = await getDisplayName(session.user.id);

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
    prisma.booking.count({ where: { status: "PENDING_ADMIN_REVIEW" } }),
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
      case "PENDING_ADMIN_REVIEW":
        return "bg-yellow-900/40 text-yellow-200";
      case "ADMIN_REVIEWING":
        return "bg-orange-900/40 text-orange-200";
      case "DJ_ASSIGNED":
        return "bg-blue-900/40 text-blue-200";
      case "CONFIRMED":
        return "bg-green-900/40 text-green-200";
      case "CANCELLED":
        return "bg-red-900/40 text-red-200";
      case "COMPLETED":
        return "bg-green-900/40 text-green-200";
      case "DISPUTED":
        return "bg-purple-900/40 text-purple-200";
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
      <AutomatedTimeoutProcessor />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/dashboard/profile" className="relative group">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 border-4 border-violet-500/30 shadow-lg group-hover:border-violet-400/50 transition-all duration-200">
                {user?.profileImage || user?.userMedia[0]?.url ? (
                  <>
                    <img
                      src={user.profileImage || user.userMedia[0]?.url}
                      alt="Profile"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="w-full h-full flex items-center justify-center hidden">
                      <span className="text-xl text-gray-300 font-bold group-hover:text-violet-300 transition-colors">
                        {session.user.name?.charAt(0) ||
                          session.user.email?.charAt(0) ||
                          "A"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xl text-gray-300 font-bold group-hover:text-violet-300 transition-colors">
                      {session.user.name?.charAt(0) ||
                        session.user.email?.charAt(0) ||
                        "A"}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-500 rounded-full border-2 border-gray-900"></div>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-300">
                Welcome back, {displayName}! Manage your Pro-DJ platform
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{totalUsers}</p>
              </div>
              <Users className="w-8 h-8" />
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
              <Calendar className="w-8 h-8" />
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
              <Music className="w-8 h-8" />
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/admin/djs"
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                Manage DJs <ArrowRight className="w-4 h-4 inline ml-1" />
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
              <User className="w-8 h-8" />
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/admin/clients"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View Clients <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Access to DJ & Client Features */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-violet-400 mb-4">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/dj"
              className="bg-violet-900/30 hover:bg-violet-900/50 border border-violet-700/30 hover:border-violet-700/50 rounded-lg p-4 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-violet-300 group-hover:text-violet-200">
                    DJ Dashboard
                  </h3>
                  <p className="text-sm text-violet-400/70 group-hover:text-violet-400/90">
                    Access DJ features, upload mixes, manage bookings
                  </p>
                </div>
                <Music className="w-8 h-8 text-violet-400 group-hover:text-violet-300" />
              </div>
            </Link>

            <Link
              href="/dashboard/client"
              className="bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/30 hover:border-blue-700/50 rounded-lg p-4 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-300 group-hover:text-blue-200">
                    Client Dashboard
                  </h3>
                  <p className="text-sm text-blue-400/70 group-hover:text-blue-400/90">
                    Book DJs, view your events, manage bookings
                  </p>
                </div>
                <User className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-violet-400 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/admin/bookings"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <ClipboardList className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">Manage Bookings</h3>
              <p className="text-gray-400 text-sm">
                View and manage all booking requests
              </p>
            </Link>

            <Link
              href="/dashboard/admin/users"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <Users className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">User Management</h3>
              <p className="text-gray-400 text-sm">
                Manage users, roles, and account statuses
              </p>
            </Link>

            <Link
              href="/dashboard/admin/djs"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <Music className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">DJ Management</h3>
              <p className="text-gray-400 text-sm">
                Manage DJ profiles and approvals
              </p>
            </Link>

            <Link
              href="/dashboard/admin/booking-queue"
              className="bg-gradient-to-r from-violet-700 to-pink-700 hover:from-violet-600 hover:to-pink-600 p-4 rounded-lg text-center transition-colors"
            >
              <Calendar className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">Booking Queue</h3>
              <p className="text-gray-200 text-sm">
                Review and assign DJs to bookings
              </p>
            </Link>

            <Link
              href="/dashboard/admin/pricing"
              className="bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 p-4 rounded-lg text-center transition-colors"
            >
              <DollarSign className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">Pricing Management</h3>
              <p className="text-gray-200 text-sm">
                Manage Pro-DJ service pricing & add-ons
              </p>
            </Link>

            <Link
              href="/dashboard/admin/clients"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <Users className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">Client Management</h3>
              <p className="text-gray-400 text-sm">
                Manage client accounts and activity
              </p>
            </Link>

            <Link
              href="/dashboard/admin/calendar"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <Calendar className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">Calendar</h3>
              <p className="text-gray-400 text-sm">
                View upcoming bookings and DJ availability
              </p>
            </Link>

            <Link
              href="/dashboard/admin/pricing"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <DollarSign className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">Pricing</h3>
              <p className="text-gray-400 text-sm">
                Manage Pro-DJ service pricing & add-ons
              </p>
            </Link>

            <Link
              href="/dashboard/media"
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center transition-colors"
            >
              <Music className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">Upload Mix</h3>
              <p className="text-gray-400 text-sm">
                Add new music mixes to the platform
              </p>
            </Link>
          </div>
        </div>

        {/* Calendar Overview */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-8 shadow-2xl border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-violet-400 mb-1">
                <Calendar className="w-6 h-6 inline mr-2" />
                Booking Calendar
              </h2>
              <p className="text-gray-400 text-sm">
                Interactive calendar with all your DJ bookings
              </p>
            </div>
            <Link
              href="/dashboard/admin/calendar"
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              View Full Calendar <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>

          <div className="h-[500px]">
            <BookingCalendar bookings={recentBookings} />
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center bg-gray-700/50 px-3 py-2 rounded-lg">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3 shadow-lg"></div>
              <span className="font-medium">Pending</span>
            </div>
            <div className="flex items-center bg-gray-700/50 px-3 py-2 rounded-lg">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3 shadow-lg"></div>
              <span className="font-medium">Confirmed</span>
            </div>
            <div className="flex items-center bg-gray-700/50 px-3 py-2 rounded-lg">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 shadow-lg"></div>
              <span className="font-medium">Accepted</span>
            </div>
            <div className="flex items-center bg-gray-700/50 px-3 py-2 rounded-lg">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-3 shadow-lg"></div>
              <span className="font-medium">Cancelled</span>
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
                href="/dashboard/bookings?view=admin"
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                View All <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mb-2 mx-auto" />
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
                View All <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>

            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mb-2 mx-auto" />
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

          {/* Timeout Management */}
          <TimeoutManagement />
        </div>
      </div>
    </div>
  );
}
