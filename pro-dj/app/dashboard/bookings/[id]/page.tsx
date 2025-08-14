import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  // Only allow ADMIN and DJ users to access booking details
  if (session.user.role !== "ADMIN" && session.user.role !== "DJ") {
    redirect("/dashboard");
  }

  // Get the booking with all related data
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      dj: {
        select: {
          stageName: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  // Check if DJ can access this booking (only if it's their booking)
  if (session.user.role === "DJ") {
    // Get the DJ's profile to check if this is their booking
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile || booking.djId !== djProfile.id) {
      redirect("/dashboard/bookings");
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-900/40 text-yellow-200 border-yellow-500";
      case "ACCEPTED":
        return "bg-blue-900/40 text-blue-200 border-blue-500";
      case "CONFIRMED":
        return "bg-green-900/40 text-green-200 border-green-500";
      case "DECLINED":
        return "bg-red-900/40 text-red-200 border-red-500";
      default:
        return "bg-gray-900/40 text-gray-200 border-gray-500";
    }
  };

  const formatDateTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return "Invalid date";
      }
      return format(dateObj, "PPP 'at' h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return "Invalid time";
      }
      return format(dateObj, "h:mm a");
    } catch (error) {
      return "Invalid time";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
              <p className="text-gray-300">
                Event: {booking.eventType} •{" "}
                {booking.eventDate
                  ? formatDateTime(booking.eventDate)
                  : "Date not specified"}
              </p>
            </div>
            <Link
              href="/dashboard/bookings"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ← Back to Bookings
            </Link>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-8">
          <span
            className={`inline-block px-4 py-2 rounded-lg border ${getStatusColor(
              booking.status
            )}`}
          >
            {booking.status}
          </span>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Details */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-violet-400 mb-4">
              Event Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Event Type</label>
                <p className="text-lg font-medium">{booking.eventType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Event Date</label>
                <p className="text-lg font-medium">
                  {booking.eventDate
                    ? formatDateTime(booking.eventDate)
                    : "Date not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Time</label>
                <p className="text-lg font-medium">
                  {booking.startTime && booking.endTime
                    ? `${formatTime(booking.startTime)} - ${formatTime(
                        booking.endTime
                      )}`
                    : "Time not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Package</label>
                <p className="text-lg font-medium">
                  {booking.packageKey || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Message</label>
                <p className="text-gray-300 bg-gray-700/50 p-3 rounded-lg">
                  {booking.message || "No message provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Client & DJ Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-violet-400 mb-4">
              People
            </h2>
            <div className="space-y-6">
              {/* Client Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-3">
                  Client
                </h3>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="font-medium">
                    {booking.user?.name || "Unknown"}
                  </p>
                  <p className="text-gray-400">{booking.user?.email}</p>
                </div>
              </div>

              {/* DJ Info */}
              {booking.dj && (
                <div>
                  <h3 className="text-lg font-medium text-gray-300 mb-3">DJ</h3>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="font-medium">🎧 {booking.dj.stageName}</p>
                    <p className="text-gray-400">{booking.dj.user?.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-violet-400 mb-4">
            Additional Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-400">Booking ID</label>
              <p className="font-mono text-sm bg-gray-700/50 p-2 rounded">
                {booking.id}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Created</label>
              <p className="text-sm">
                {booking.createdAt
                  ? formatDateTime(booking.createdAt)
                  : "Unknown"}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Last Updated</label>
              <p className="text-sm">
                {booking.updatedAt
                  ? formatDateTime(booking.updatedAt)
                  : "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {session.user.role === "ADMIN" && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-violet-400 mb-4">
              Admin Actions
            </h2>
            <div className="flex space-x-4">
              <Link
                href={`/dashboard/bookings/${booking.id}/edit`}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Edit Booking
              </Link>
              <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Delete Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
