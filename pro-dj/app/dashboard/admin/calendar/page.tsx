import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatTimeRange } from "@/lib/booking-utils";

export default async function AdminCalendarPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get current date and next 30 days
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Get all bookings for the current month
  const bookings = await prisma.booking.findMany({
    where: {
      eventDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      user: { select: { name: true, email: true } },
      dj: { select: { stageName: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  // Get all DJs
  const djs = await prisma.djProfile.findMany({
    include: {
      user: { select: { name: true, email: true } },
      bookings: {
        where: {
          eventDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: { eventDate: true, eventType: true },
      },
    },
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(startOfMonth);
    const lastDay = new Date(endOfMonth);

    // Add padding for first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (
      let d = new Date(startOfMonth);
      d <= lastDay;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(new Date(d));
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.eventDate);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  // Get DJ availability for a specific date
  const getDjAvailabilityForDate = (date: Date) => {
    return djs.map((dj) => {
      const hasBooking = dj.bookings.some((booking) => {
        const bookingDate = new Date(booking.eventDate);
        return bookingDate.toDateString() === date.toDateString();
      });

      return {
        ...dj,
        isAvailable: !hasBooking,
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Booking Calendar</h1>
              <p className="text-gray-300">
                {today.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <Link
              href="/dashboard/admin"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-gray-400 font-medium py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-32 p-2 border border-gray-700 ${
                  day ? "bg-gray-700/50" : "bg-gray-800"
                }`}
              >
                {day && (
                  <>
                    {/* Date Header */}
                    <div
                      className={`text-sm font-medium mb-2 ${
                        day.toDateString() === today.toDateString()
                          ? "text-violet-400"
                          : "text-gray-300"
                      }`}
                    >
                      {day.getDate()}
                    </div>

                    {/* Bookings for this day */}
                    <div className="space-y-1">
                      {getBookingsForDate(day).map((booking) => (
                        <div
                          key={booking.id}
                          className="text-xs p-1 rounded bg-gray-600/50 border-l-2 border-violet-400"
                        >
                          <div className="font-medium truncate">
                            {booking.user?.name || booking.user?.email}
                          </div>
                          <div className="text-gray-400 truncate">
                            {booking.eventType}
                          </div>
                          {booking.startTime && booking.endTime && (
                            <div className="text-gray-400 truncate text-xs">
                              {formatTimeRange(
                                booking.startTime,
                                booking.endTime
                              )}
                            </div>
                          )}
                          <span
                            className={`inline-block px-1 rounded text-xs ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* This Week's Bookings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-violet-400 mb-4">
              This Week&apos;s Bookings
            </h2>
            {bookings
              .filter((booking) => {
                const bookingDate = new Date(booking.eventDate);
                const weekFromNow = new Date(today);
                weekFromNow.setDate(today.getDate() + 7);
                return bookingDate >= today && bookingDate <= weekFromNow;
              })
              .slice(0, 5)
              .map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg mb-3"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {booking.user?.name || booking.user?.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      {booking.eventType} • {formatDate(booking.eventDate)}
                    </div>
                    {booking.dj && (
                      <div className="text-xs text-violet-400">
                        DJ: {booking.dj.stageName}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            {bookings.filter((booking) => {
              const bookingDate = new Date(booking.eventDate);
              const weekFromNow = new Date(today);
              weekFromNow.setDate(today.getDate() + 7);
              return bookingDate >= today && bookingDate <= weekFromNow;
            }).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📅</div>
                <p>No upcoming bookings this week</p>
              </div>
            )}
          </div>

          {/* DJ Availability */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-violet-400 mb-4">
              DJ Availability
            </h2>
            <div className="space-y-3">
              {djs.map((dj) => {
                const todayBookings = dj.bookings.filter((booking) => {
                  const bookingDate = new Date(booking.eventDate);
                  return bookingDate.toDateString() === today.toDateString();
                });

                const isAvailableToday = todayBookings.length === 0;

                return (
                  <div
                    key={dj.id}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">{dj.stageName}</div>
                      <div className="text-xs text-gray-400">
                        {dj.user?.name || dj.user?.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isAvailableToday
                            ? "bg-green-900/40 text-green-200"
                            : "bg-red-900/40 text-red-200"
                        }`}
                      >
                        {isAvailableToday ? "Available" : "Booked"}
                      </span>
                      {!isAvailableToday && (
                        <div className="text-xs text-gray-400 mt-1">
                          {todayBookings.length} event
                          {todayBookings.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">
              {bookings.filter((b) => b.status === "CONFIRMED").length}
            </div>
            <div className="text-gray-400 text-sm">Confirmed Events</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-400">
              {bookings.filter((b) => b.status === "PENDING").length}
            </div>
            <div className="text-gray-400 text-sm">Pending Requests</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-violet-400">
              {djs.length}
            </div>
            <div className="text-gray-400 text-sm">Active DJs</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">
              {
                bookings.filter((b) => {
                  const bookingDate = new Date(b.eventDate);
                  const weekFromNow = new Date(today);
                  weekFromNow.setDate(today.getDate() + 7);
                  return bookingDate >= today && bookingDate <= weekFromNow;
                }).length
              }
            </div>
            <div className="text-gray-400 text-sm">This Week</div>
          </div>
        </div>
      </div>
    </div>
  );
}
