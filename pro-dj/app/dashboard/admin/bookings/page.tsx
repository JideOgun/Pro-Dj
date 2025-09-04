import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { hasAdminPrivileges } from "@/lib/auth-utils";
import AdminBookingActions from "./AdminBookingActions";

export default async function AdminBookingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (!hasAdminPrivileges(session.user)) {
    redirect("/dashboard");
  }

  // Get all bookings with user and DJ details
  const bookings = await prisma.booking.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      dj: {
        select: {
          stageName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_ADMIN_REVIEW":
        return "bg-yellow-900/40 text-yellow-200 border-yellow-700/30";
      case "ADMIN_REVIEWING":
        return "bg-orange-900/40 text-orange-200 border-orange-700/30";
      case "DJ_ASSIGNED":
        return "bg-blue-900/40 text-blue-200 border-blue-700/30";
      case "CONFIRMED":
        return "bg-green-900/40 text-green-200 border-green-700/30";
      case "CANCELLED":
        return "bg-red-900/40 text-red-200 border-red-700/30";
      default:
        return "bg-gray-800 text-gray-200 border-gray-600/30";
    }
  };

  const formatPrice = (cents: number | null) => {
    if (!cents) return "-";
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
              <h1 className="text-3xl font-bold mb-2">Booking Management</h1>
              <p className="text-gray-300">
                Manage and override all booking statuses
              </p>
            </div>
            <Link
              href="/dashboard/admin"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">
              {bookings.length}
            </div>
            <div className="text-gray-400 text-sm">Total Bookings</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-400">
              {bookings.filter((b) => b.status === "PENDING_ADMIN_REVIEW").length}
            </div>
            <div className="text-gray-400 text-sm">Pending</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">
              {bookings.filter((b) => b.status === "CONFIRMED").length}
            </div>
            <div className="text-gray-400 text-sm">Confirmed</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-red-400">
              {bookings.filter((b) => b.status === "CANCELLED").length}
            </div>
            <div className="text-gray-400 text-sm">Cancelled</div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Event Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    DJ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">
                          {booking.eventType}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {booking.message.substring(0, 50)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">
                          {booking.user.name || "No Name"}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {booking.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">
                        {booking.dj?.stageName || "Not assigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-gray-300">
                          {format(new Date(booking.eventDate), "MMM d, yyyy")}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {format(new Date(booking.startTime), "h:mm a")} -{" "}
                          {format(new Date(booking.endTime), "h:mm a")}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatPrice(booking.quotedPriceCents)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          View
                        </Link>
                        <AdminBookingActions
                          booking={booking}
                          currentAdminId={session.user.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
