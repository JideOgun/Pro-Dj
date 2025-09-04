import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { hasAdminPrivileges } from "@/lib/auth-utils";

export default async function AdminClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (!hasAdminPrivileges(session.user)) {
    redirect("/dashboard");
  }

  // Get all clients with their booking stats
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      bookings: {
        include: {
          dj: {
            select: {
              stageName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        include: {
          dj: {
            select: {
              stageName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
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
      case "PENDING_ADMIN_REVIEW":
        return "bg-yellow-900/40 text-yellow-200 border-yellow-700/30";
      default:
        return "bg-gray-800 text-gray-200 border-gray-600/30";
    }
  };

  const calculateTotalSpent = (bookings: any[]) => {
    return bookings
      .filter(
        (booking) => booking.quotedPriceCents && booking.status === "CONFIRMED"
      )
      .reduce((total, booking) => total + (booking.quotedPriceCents || 0), 0);
  };

  const formatPrice = (cents: number) => {
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
              <h1 className="text-3xl font-bold mb-2">Client Management</h1>
              <p className="text-gray-300">
                Manage client accounts and view their activity
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
              {clients.length}
            </div>
            <div className="text-gray-400 text-sm">Total Clients</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">
              {clients.filter((c) => c.status === "ACTIVE").length}
            </div>
            <div className="text-gray-400 text-sm">Active Clients</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">
              {clients.reduce(
                (total, client) => total + client.bookings.length,
                0
              )}
            </div>
            <div className="text-gray-400 text-sm">Total Bookings</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-400">
              {formatPrice(
                clients.reduce(
                  (total, client) =>
                    total + calculateTotalSpent(client.bookings),
                  0
                )
              )}
            </div>
            <div className="text-gray-400 text-sm">Total Revenue</div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Spending
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
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">
                          {client.name || "No Name"}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {client.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                          client.status
                        )}`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-gray-300">
                          {client.bookings.length} bookings
                        </div>
                        <div className="text-gray-400 text-sm">
                          {client.reviews.length} reviews given
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatPrice(calculateTotalSpent(client.bookings))}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {format(new Date(client.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/admin/users/${client.id}`}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/dashboard/admin/bookings?client=${client.id}`}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Bookings
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
