import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import BookingsTable from "@/components/BookingsTable";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  // Allow ADMIN, DJ, and CLIENT users to access bookings
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "DJ" &&
    session.user.role !== "CLIENT"
  ) {
    redirect("/dashboard");
  }

  // Build the query based on user role and status filter
  let whereClause: {
    djId?: string | null;
    userId?: string;
    status?: "PENDING" | "ACCEPTED" | "CONFIRMED" | "DECLINED";
  } = {};

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
  } else if (session.user.role === "CLIENT") {
    // Client sees only their bookings
    whereClause = { userId: session.user.id };
  }

  // Add status filter if provided
  if (
    searchParams.status &&
    ["PENDING", "ACCEPTED", "CONFIRMED", "DECLINED"].includes(
      searchParams.status
    )
  ) {
    whereClause.status = searchParams.status as
      | "PENDING"
      | "ACCEPTED"
      | "CONFIRMED"
      | "DECLINED";
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
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {session.user.role === "ADMIN"
                  ? "All Bookings"
                  : session.user.role === "CLIENT"
                  ? "My Bookings"
                  : "My Bookings"}
              </h1>
              <p className="text-gray-300">
                {session.user.role === "ADMIN"
                  ? "Manage all booking requests across the platform"
                  : session.user.role === "CLIENT"
                  ? "View and track your booking requests"
                  : "View and manage your booking requests"}
              </p>
            </div>
            <Link
              href={
                session.user.role === "ADMIN"
                  ? "/dashboard/admin"
                  : session.user.role === "CLIENT"
                  ? "/dashboard/client"
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
          <Link
            href="/dashboard/bookings"
            className={`bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group ${
              !searchParams.status ? "ring-2 ring-violet-500" : ""
            }`}
          >
            <div className="text-2xl font-bold text-white group-hover:text-violet-300">
              {
                bookings.filter(
                  (b) =>
                    !searchParams.status || b.status === searchParams.status
                ).length
              }
            </div>
            <div className="text-gray-400 text-sm group-hover:text-gray-300">
              Total Bookings
            </div>
          </Link>
          <Link
            href="/dashboard/bookings?status=PENDING"
            className={`bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group ${
              searchParams.status === "PENDING" ? "ring-2 ring-yellow-500" : ""
            }`}
          >
            <div className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300">
              {bookings.filter((b) => b.status === "PENDING").length}
            </div>
            <div className="text-gray-400 text-sm group-hover:text-gray-300">
              Pending
            </div>
          </Link>
          <Link
            href="/dashboard/bookings?status=ACCEPTED"
            className={`bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group ${
              searchParams.status === "ACCEPTED" ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="text-2xl font-bold text-blue-400 group-hover:text-blue-300">
              {bookings.filter((b) => b.status === "ACCEPTED").length}
            </div>
            <div className="text-gray-400 text-sm group-hover:text-gray-300">
              Accepted
            </div>
          </Link>
          <Link
            href="/dashboard/bookings?status=CONFIRMED"
            className={`bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group ${
              searchParams.status === "CONFIRMED" ? "ring-2 ring-green-500" : ""
            }`}
          >
            <div className="text-2xl font-bold text-green-400 group-hover:text-green-300">
              {bookings.filter((b) => b.status === "CONFIRMED").length}
            </div>
            <div className="text-gray-400 text-sm group-hover:text-gray-300">
              Confirmed
            </div>
          </Link>
        </div>

        {/* Bookings Table */}
        <BookingsTable
          initialBookings={bookings}
          userRole={session.user.role}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
