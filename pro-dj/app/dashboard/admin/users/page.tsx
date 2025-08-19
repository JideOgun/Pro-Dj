import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { hasAdminPrivileges } from "@/lib/auth-utils";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (!hasAdminPrivileges(session.user)) {
    redirect("/dashboard");
  }

  // Get all users with their profiles
  const users = await prisma.user.findMany({
    include: {
      djProfile: true,
      bookings: {
        select: {
          id: true,
          status: true,
          createdAt: true,
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">User Management</h1>
              <p className="text-gray-300">
                Manage all users, roles, and account statuses
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
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-gray-400 text-sm">Total Users</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">
              {users.filter((u) => u.role === "DJ").length}
            </div>
            <div className="text-gray-400 text-sm">DJs</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">
              {users.filter((u) => u.role === "CLIENT").length}
            </div>
            <div className="text-gray-400 text-sm">Clients</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-purple-400">
              {users.filter((u) => u.role === "ADMIN").length}
            </div>
            <div className="text-gray-400 text-sm">Admins</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Bookings
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">
                          {user.name || "No Name"}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {user.email}
                        </div>
                        {user.djProfile && (
                          <div className="text-violet-400 text-sm">
                            Stage: {user.djProfile.stageName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                          user.status || "ACTIVE"
                        )}`}
                      >
                        {user.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {user.bookings.length} bookings
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/admin/users/${user.id}`}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Manage
                        </Link>
                        {user.role === "DJ" && (
                          <Link
                            href={`/dashboard/admin/djs/${user.id}`}
                            className="bg-violet-600 hover:bg-violet-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            DJ Profile
                          </Link>
                        )}
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
