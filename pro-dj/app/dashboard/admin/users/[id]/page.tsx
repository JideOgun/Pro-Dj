import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { hasAdminPrivileges } from "@/lib/auth-utils";
import UserManagementActions from "./UserManagementActions";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function UserManagementPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (!hasAdminPrivileges(session.user)) {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: await params.id },
    include: {
      djProfile: true,
      bookings: {
        include: {
          dj: true,
        },
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        include: {
          dj: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/dashboard/admin/users");
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-900/40 text-green-200 border-green-700/30";
      case "SUSPENDED":
        return "bg-red-900/40 text-red-200 border-red-700/30";
      case "PENDING":
        return "bg-yellow-900/40 text-yellow-200 border-yellow-700/30";
      default:
        return "bg-gray-800 text-gray-200 border-gray-600/30";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-900/40 text-purple-200 border-purple-700/30";
      case "DJ":
        return "bg-blue-900/40 text-blue-200 border-blue-700/30";
      case "CLIENT":
        return "bg-green-900/40 text-green-200 border-green-700/30";
      default:
        return "bg-gray-800 text-gray-200 border-gray-600/30";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage User</h1>
              <p className="text-gray-300">
                User details and management options
              </p>
            </div>
            <Link
              href="/dashboard/admin/users"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ← Back to Users
            </Link>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">User Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <span className="ml-2 text-white">
                    {user.name || "No Name"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <span className="ml-2 text-white">{user.email}</span>
                </div>
                <div>
                  <span className="text-gray-400">Role:</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Joined:</span>
                  <span className="ml-2 text-white">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                {user.suspendedAt && (
                  <div>
                    <span className="text-gray-400">Suspended:</span>
                    <span className="ml-2 text-red-400">
                      {format(new Date(user.suspendedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {user.suspensionReason && (
                  <div>
                    <span className="text-gray-400">Reason:</span>
                    <span className="ml-2 text-red-400">
                      {user.suspensionReason}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Total Bookings:</span>
                  <span className="ml-2 text-white">
                    {user.bookings.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Reviews Given:</span>
                  <span className="ml-2 text-white">{user.reviews.length}</span>
                </div>
                {user.djProfile && (
                  <>
                    <div>
                      <span className="text-gray-400">Stage Name:</span>
                      <span className="ml-2 text-violet-400">
                        {user.djProfile.stageName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">DJ Rating:</span>
                      <span className="ml-2 text-yellow-400">
                        {user.djProfile.rating.toFixed(1)} ⭐
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <UserManagementActions user={user} currentAdminId={session.user.id} />

        {/* Recent Bookings */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
          {user.bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700/50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                      Event
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                      DJ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {user.bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-4 py-2">
                        <div className="text-white font-medium">
                          {booking.eventType}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {booking.message.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {format(new Date(booking.eventDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            booking.status === "CONFIRMED"
                              ? "bg-green-900/40 text-green-200"
                              : booking.status === "PENDING"
                              ? "bg-yellow-900/40 text-yellow-200"
                              : "bg-gray-800 text-gray-200"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {booking.dj?.stageName || "Not assigned"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No bookings found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
