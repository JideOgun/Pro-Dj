import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientRoleSwitcher from "@/components/ClientRoleSwitcher";
import NotificationsContainer from "@/components/NotificationsContainer";
import { Music, AlertTriangle, Calendar, User } from "lucide-react";
import BookingsTable from "@/components/BookingsTable";

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  // Get user with profile data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      userMedia: {
        where: { type: "PROFILE_PICTURE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Get user's bookings
  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      dj: { select: { stageName: true, genres: true } },
    },
  });

  // Get unread notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Role Switcher */}
        <ClientRoleSwitcher />

        {/* Header with Profile Photo */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <Link href="/dashboard/profile" className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 border-4 border-violet-500/30 shadow-lg group-hover:border-violet-400/50 transition-all duration-200">
                {user?.profileImage || user?.userMedia[0]?.url ? (
                  <img
                    src={user.profileImage || user.userMedia[0]?.url}
                    alt="Profile"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-gray-300 font-bold group-hover:text-violet-300 transition-colors">
                      {session.user.name?.charAt(0) ||
                        session.user.email?.charAt(0) ||
                        "U"}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back,{" "}
                {session.user.name ||
                  session.user.email?.split("@")[0] ||
                  "there"}
                ! 👋
              </h1>
              <p className="text-gray-300">
                Ready to create more amazing events? Here&apos;s everything you
                need to manage your bookings.
              </p>
            </div>
          </div>
          <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4">
            <p className="text-violet-200 text-sm">
              💡 <strong>Quick tip:</strong> Need to book another event? Click
              &quot;New Booking&quot; below or head to the homepage!
            </p>
            <p className="text-violet-200 text-sm mt-2">
              <Music className="w-5 h-5 inline mr-2" />
              <strong>Multi-DJ Bookings:</strong> You can now book multiple DJs
              for the same event with different time slots. Each DJ will receive
              their own booking request.
            </p>
          </div>
        </div>

        {/* Notifications */}
        <NotificationsContainer initialNotifications={notifications} />

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Link
            href="/dashboard/bookings"
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group"
          >
            <div className="text-2xl font-bold text-violet-400 group-hover:text-violet-300">
              {bookings.length}
            </div>
            <div className="text-gray-400 group-hover:text-gray-300">
              Total Bookings
            </div>
          </Link>
          <Link
            href="/dashboard/bookings?status=PENDING"
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group"
          >
            <div className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300">
              {bookings.filter((b) => b.status === "PENDING").length}
            </div>
            <div className="text-gray-400 group-hover:text-gray-300">
              Pending Requests
            </div>
          </Link>
          <Link
            href="/dashboard/bookings?status=CONFIRMED"
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group"
          >
            <div className="text-2xl font-bold text-green-400 group-hover:text-green-300">
              {bookings.filter((b) => b.status === "CONFIRMED").length}
            </div>
            <div className="text-gray-400 group-hover:text-gray-300">
              Confirmed Events
            </div>
          </Link>
          <Link
            href="/dashboard/bookings?status=ACCEPTED"
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group"
          >
            <div className="text-2xl font-bold text-blue-400 group-hover:text-blue-300">
              {bookings.filter((b) => b.status === "ACCEPTED").length}
            </div>
            <div className="text-gray-400 group-hover:text-gray-300">
              Accepted Events
            </div>
          </Link>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-violet-400">
            Account Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Name:</span>
              <span className="ml-2 text-white">
                {session.user.name || "Not provided"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Email:</span>
              <span className="ml-2 text-white">{session.user.email}</span>
            </div>
            <div>
              <span className="text-gray-400">Account Type:</span>
              <span className="ml-2 text-white capitalize">
                {session.user.role?.toLowerCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Total Bookings:</span>
              <span className="ml-2 text-white">{bookings.length}</span>
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-violet-400">
              Your Bookings
            </h2>
            <Link
              href="/book"
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm"
            >
              New Booking
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
              <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
              <p className="text-gray-300 mb-4">
                Ready to book your next event?
              </p>
              <Link
                href="/book"
                className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-lg inline-block"
              >
                Book Now
              </Link>
            </div>
          ) : (
            <BookingsTable
              initialBookings={bookings}
              userRole="CLIENT"
              userId={session.user.id}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/book"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors"
          >
            <Music className="w-8 h-8 mb-2" />
            <h3 className="font-semibold mb-2">Book New Event</h3>
            <p className="text-gray-400 text-sm">
              Request a booking for your next event
            </p>
          </Link>

          <Link
            href="/dashboard/profile"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors"
          >
            <User className="w-8 h-8 mb-2" />
            <h3 className="font-semibold mb-2">Profile Settings</h3>
            <p className="text-gray-400 text-sm">
              Update your profile and preferences
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

          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="text-3xl mb-2">📧</div>
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-gray-400 text-sm">Need help? Contact us</p>
          </div>
        </div>
      </div>
    </div>
  );
}
