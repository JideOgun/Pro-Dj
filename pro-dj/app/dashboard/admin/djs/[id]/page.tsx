import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { hasAdminPrivileges } from "@/lib/auth-utils";
import DjApprovalActions from "./DjApprovalActions";
import UserManagementActions from "../../users/[id]/UserManagementActions";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function DjManagementPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (!hasAdminPrivileges(session.user)) {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      djProfile: true,
      bookings: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        include: {
          booking: {
            select: {
              eventType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user || user.role !== "DJ") {
    redirect("/dashboard/admin/djs");
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

  const getVerificationColor = (isVerified: boolean) => {
    return isVerified
      ? "bg-green-900/40 text-green-200 border-green-700/30"
      : "bg-yellow-900/40 text-yellow-200 border-yellow-700/30";
  };

  const calculateAverageRating = (reviews: { rating: number }[]) => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">DJ Management</h1>
              <p className="text-gray-300">Review and manage DJ profile</p>
            </div>
            <Link
              href="/dashboard/admin/djs"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ← Back to DJs
            </Link>
          </div>
        </div>

        {/* DJ Info Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">DJ Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Stage Name:</span>
                  <span className="ml-2 text-white font-medium">
                    {user.djProfile?.stageName || "No Stage Name"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <span className="ml-2 text-white">{user.email}</span>
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
                  <span className="text-gray-400">Verification:</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getVerificationColor(
                      user.djProfile?.isVerified || false
                    )}`}
                  >
                    {user.djProfile?.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Joined:</span>
                  <span className="ml-2 text-white">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Location:</span>
                  <span className="ml-2 text-white">
                    {user.location ||
                      user.djProfile?.location ||
                      "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Experience:</span>
                  <span className="ml-2 text-white">
                    {user.djProfile?.experience || 0} years
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Genres:</span>
                  <span className="ml-2 text-white">
                    {user.djProfile?.genres?.join(", ") || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Base Price:</span>
                  <span className="ml-2 text-white">
                    {user.djProfile?.basePriceCents
                      ? `$${(user.djProfile.basePriceCents / 100).toFixed(
                          2
                        )}/hr`
                      : "Not set"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.djProfile?.bio && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Bio</h3>
              <p className="text-gray-300">{user.djProfile.bio}</p>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <UserManagementActions user={user} currentAdminId={session.user.id} />

        {/* Approval Actions - Only show for pending DJs */}
        {user.status === "PENDING" && (
          <DjApprovalActions user={user} currentAdminId={session.user.id} />
        )}

        {/* Performance Stats */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Statistics</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {user.bookings.length}
              </div>
              <div className="text-gray-400 text-sm">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {calculateAverageRating(user.reviews).toFixed(1)} ⭐
              </div>
              <div className="text-gray-400 text-sm">
                {user.reviews.length} Reviews
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {user.djProfile?.totalBookings || 0}
              </div>
              <div className="text-gray-400 text-sm">Completed Events</div>
            </div>
          </div>
        </div>

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
                      Client
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                      Status
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
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {booking.user.name || booking.user.email}
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
