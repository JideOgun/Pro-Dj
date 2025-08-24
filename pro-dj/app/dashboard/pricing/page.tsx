import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import PackageManager from "./PackageManager";
import EventTypeManager from "./EventTypeManager";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DollarSign, Settings, ArrowLeft } from "lucide-react";

export default async function PricingPage() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    redirect("/auth");
  }

  // Check if user is also a DJ and redirect them to DJ pricing page
  const user = await prisma.user.findUnique({
    where: { id: gate.session?.user?.id },
    include: { djProfile: true }
  });

  if (user?.djProfile) {
    redirect("/dashboard/dj/pricing");
  }

  const rows = await prisma.pricing.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      type: true,
      key: true,
      label: true,
      priceCents: true,
      isActive: true,
      sortOrder: true,
    },
  });

  // Group by type for a cleaner table
  const byType = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    (acc[r.type] ||= []).push(r);
    return acc;
  }, {});

  // Get event types with package counts
  const eventTypes = Object.entries(byType).map(([type, packages]) => ({
    type,
    packageCount: packages.length,
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-violet-400" />
                Pricing Management
              </h1>
              <p className="text-gray-300">
                Manage platform pricing packages and rates
              </p>
            </div>
            <Link
              href="/dashboard/admin"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{rows.length}</p>
                <p className="text-gray-400 text-sm">Total Packages</p>
              </div>
              <DollarSign className="w-8 h-8 text-violet-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {rows.filter((r) => r.isActive).length}
                </p>
                <p className="text-gray-400 text-sm">Active Packages</p>
              </div>
              <Settings className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {Object.keys(byType).length}
                </p>
                <p className="text-gray-400 text-sm">Event Types</p>
              </div>
              <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-sm font-bold">ET</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Type Manager */}
        <EventTypeManager eventTypes={eventTypes} />

        {/* Pricing Sections */}
        <div className="space-y-8">
          {Object.entries(byType).map(([type, list]) => (
            <PackageManager key={type} type={type} rows={list} />
          ))}
        </div>

        {/* Empty State */}
        {Object.keys(byType).length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2 text-gray-300">
              No Pricing Packages
            </h3>
            <p className="text-gray-400">
              No pricing packages have been configured yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
