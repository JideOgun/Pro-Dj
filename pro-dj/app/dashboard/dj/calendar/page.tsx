import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import BookingCalendar from "@/components/BookingCalendar";

export default async function DjCalendarPage() {
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

  // Get all bookings
  const bookings = await prisma.booking.findMany({
    where: bookingWhereClause,
    include: {
      user: { select: { name: true, email: true } },
      dj: { select: { stageName: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">📅 DJ Calendar</h1>
              <p className="text-gray-300">
                {session.user.role === "ADMIN"
                  ? "View and manage all DJ bookings"
                  : `View and manage all your bookings - ${djProfile?.stageName}`}
              </p>
            </div>
            <Link
              href="/dashboard/dj"
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-8 shadow-2xl border border-gray-700">
          <div className="h-[700px]">
            <BookingCalendar bookings={bookings} />
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-violet-400 mb-4">
            Booking Status Legend
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <div>
                <div className="font-medium text-white">Pending</div>
                <div className="text-sm text-gray-400">
                  Awaiting your response
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <div>
                <div className="font-medium text-white">Accepted</div>
                <div className="text-sm text-gray-400">
                  You've accepted the booking
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-white">Confirmed</div>
                <div className="text-sm text-gray-400">
                  Booking is confirmed
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div>
                <div className="font-medium text-white">Declined</div>
                <div className="text-sm text-gray-400">
                  Booking was declined
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/bookings"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-colors"
          >
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-xl font-semibold mb-2">Manage Bookings</h3>
            <p className="text-gray-400">
              View detailed booking information and respond to requests
            </p>
          </Link>

          <Link
            href="/dashboard/dj"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-colors"
          >
            <div className="text-3xl mb-3">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
            <p className="text-gray-400">
              Return to your main dashboard overview
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
