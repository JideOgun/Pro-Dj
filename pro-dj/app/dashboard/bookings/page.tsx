import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import BookingsTable from "@/components/BookingsTable";

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  // Only allow ADMIN and DJ users to access bookings
  if (session.user.role !== "ADMIN" && session.user.role !== "DJ") {
    redirect("/dashboard");
  }

  // Build the query based on user role
  let whereClause = {};

  if (session.user.role === "ADMIN") {
    // Admin sees all bookings
    whereClause = {};
  } else if (session.user.role === "DJ") {
    // DJ sees only their bookings - need to get their DJ profile first
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (djProfile) {
      whereClause = { djId: djProfile.id };
    } else {
      // If no DJ profile found, show no bookings
      whereClause = { djId: null };
    }
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      dj: { select: { stageName: true } },
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {session.user.role === "ADMIN" ? "All Bookings" : "My Bookings"}
              </h1>
              <p className="text-gray-300">
                {session.user.role === "ADMIN"
                  ? "Manage all booking requests across the platform"
                  : "View and manage your booking requests"}
              </p>
            </div>
            <Link
              href={
                session.user.role === "ADMIN"
                  ? "/dashboard/admin"
                  : "/dashboard/dj"
              }
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ← Back to Dashboard
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
              {bookings.filter((b) => b.status === "PENDING").length}
            </div>
            <div className="text-gray-400 text-sm">Pending</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">
              {bookings.filter((b) => b.status === "ACCEPTED").length}
            </div>
            <div className="text-gray-400 text-sm">Accepted</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">
              {bookings.filter((b) => b.status === "CONFIRMED").length}
            </div>
            <div className="text-gray-400 text-sm">Confirmed</div>
          </div>
        </div>

        {/* Bookings Table */}
        <BookingsTable
          initialBookings={bookings}
          userRole={session.user.role}
        />
      </div>
    </div>
  );
}
