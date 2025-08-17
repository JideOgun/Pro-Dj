import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import BookingCalendar from "@/components/BookingCalendar";

export default async function AdminCalendarPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get all bookings for the calendar
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { name: true, email: true } },
      dj: { select: { stageName: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">📅 Admin Calendar</h1>
              <p className="text-gray-300">
                View and manage all bookings across your DJ platform
              </p>
            </div>
            <Link
              href="/dashboard/admin"
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Full Calendar */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-8 shadow-2xl border border-gray-700">
          <div className="h-[800px]">
            <BookingCalendar bookings={bookings} />
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-violet-400 mb-4">
            Booking Status Legend
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
              <span className="text-sm">Accepted</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
              <span className="text-sm">Declined</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
