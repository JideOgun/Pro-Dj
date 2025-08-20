import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { hasAdminPrivileges } from "@/lib/auth-utils";

export default async function AdminDjsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (!hasAdminPrivileges(session.user)) {
    redirect("/dashboard");
  }

  // Get all DJs with their profiles and stats
  const djs = await prisma.user.findMany({
    where: { role: "DJ" },
    include: {
      djProfile: true,
      bookings: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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

  const getVerificationColor = (isApprovedByAdmin: boolean) => {
    return isApprovedByAdmin
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">DJ Management</h1>
              <p className="text-gray-300">
                Manage DJ profiles, approvals, and performance
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
            <div className="text-2xl font-bold text-white">{djs.length}</div>
            <div className="text-gray-400 text-sm">Total DJs</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">
              {djs.filter((dj) => dj.status === "ACTIVE").length}
            </div>
            <div className="text-gray-400 text-sm">Active DJs</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-400">
              {
                djs.filter((dj) => dj.djProfile?.isApprovedByAdmin === false)
                  .length
              }
            </div>
            <div className="text-gray-400 text-sm">Pending Verification</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">
              {djs.filter((dj) => dj.status === "SUSPENDED").length}
            </div>
            <div className="text-gray-400 text-sm">Suspended DJs</div>
          </div>
        </div>

        {/* DJs Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    DJ Profile
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Verification
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {djs.map((dj) => (
                  <tr
                    key={dj.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">
                          {dj.djProfile?.stageName || "No Stage Name"}
                        </div>
                        <div className="text-gray-400 text-sm">{dj.email}</div>
                        <div className="text-gray-400 text-sm">
                          {dj.location ||
                            dj.djProfile?.location ||
                            "No location"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                          dj.status
                        )}`}
                      >
                        {dj.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getVerificationColor(
                          dj.djProfile?.isApprovedByAdmin || false
                        )}`}
                      >
                        {dj.djProfile?.isApprovedByAdmin
                          ? "Verified"
                          : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-gray-300">
                          {dj.bookings.length} bookings
                        </div>
                        <div className="text-yellow-400">
                          {calculateAverageRating(dj.reviews).toFixed(1)} ⭐ (
                          {dj.reviews.length} reviews)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {format(new Date(dj.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {dj.status === "PENDING" ? (
                          <>
                            <button
                              onClick={() =>
                                (window.location.href = `/dashboard/admin/djs/${dj.id}`)
                              }
                              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Review
                            </button>
                          </>
                        ) : (
                          <Link
                            href={`/dashboard/admin/djs/${dj.id}`}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Manage
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/admin/users/${dj.id}`}
                          className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          User
                        </Link>
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
