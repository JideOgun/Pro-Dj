import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import Actions from "./row-actions"; // client component below

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only allow ADMIN and DJ users to access bookings
  if (session.user.role !== "ADMIN" && session.user.role !== "DJ") {
    redirect("/dashboard");
  }

  // Build the query based on user role
  const whereClause =
    session.user.role === "ADMIN"
      ? {} // Admin sees all bookings
      : { djId: session.user.id }; // DJ sees only their bookings

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
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Event Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Event Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Package
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Client
                  </th>
                  {session.user.role === "ADMIN" && (
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                      DJ
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Quote
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {new Date(b.eventDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      {b.startTime && b.endTime && (
                        <div className="text-sm text-gray-400">
                          {new Date(b.startTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(b.endTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-900/30 text-violet-200">
                        {b.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {b.packageKey ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">
                        {b.user?.name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-400">
                        {b.user?.email}
                      </div>
                    </td>
                    {session.user.role === "ADMIN" && (
                      <td className="px-6 py-4">
                        {b.dj?.stageName ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-200">
                            {b.dj.stageName}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Unassigned
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {b.quotedPriceCents ? (
                        <span className="font-semibold text-green-400">
                          ${(b.quotedPriceCents / 100).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          b.status === "PENDING"
                            ? "bg-yellow-900/40 text-yellow-200"
                            : b.status === "ACCEPTED"
                            ? "bg-blue-900/40 text-blue-200"
                            : b.status === "CONFIRMED"
                            ? "bg-green-900/40 text-green-200"
                            : b.status === "DECLINED"
                            ? "bg-red-900/40 text-red-200"
                            : "bg-gray-800 text-gray-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Actions
                        id={b.id}
                        status={b.status}
                        checkoutSessionId={b.checkoutSessionId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bookings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-300">
                {session.user.role === "ADMIN"
                  ? "No bookings found"
                  : "No bookings yet"}
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {session.user.role === "ADMIN"
                  ? "Bookings will appear here when clients make requests"
                  : "Your booking requests will appear here"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
