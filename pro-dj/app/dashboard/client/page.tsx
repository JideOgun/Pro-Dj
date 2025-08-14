import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Get user's bookings
  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back,{" "}
            {session.user.name || session.user.email?.split("@")[0] || "there"}!
            👋
          </h1>
          <p className="text-gray-300 mb-4">
            Ready to create more amazing events? Here&apos;s everything you need
            to manage your bookings.
          </p>
          <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4">
            <p className="text-violet-200 text-sm">
              💡 <strong>Quick tip:</strong> Need to book another event? Click
              &quot;New Booking&quot; below or head to the homepage!
            </p>
          </div>
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
              <div className="text-gray-400 text-6xl mb-4">📅</div>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="p-3 text-gray-300">Event Date</th>
                    <th className="p-3 text-gray-300">Event Type</th>
                    <th className="p-3 text-gray-300">Package</th>
                    <th className="p-3 text-gray-300">Quote</th>
                    <th className="p-3 text-gray-300">Status</th>
                    <th className="p-3 text-gray-300">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
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
                      <td className="p-3">{booking.packageKey || "Custom"}</td>
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
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Link
            href="/book"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors"
          >
            <div className="text-3xl mb-2">🎵</div>
            <h3 className="font-semibold mb-2">Book New Event</h3>
            <p className="text-gray-400 text-sm">
              Request a booking for your next event
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
