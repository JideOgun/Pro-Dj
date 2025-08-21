"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface SecurityClearance {
  id: string;
  userId: string;
  taxIdLastFour: string;
  taxIdType: string;
  businessName?: string;
  businessType?: string;
  isVerified: boolean;
  verifiedAt?: string;
  lastAccessedAt?: string;
  lastAccessedBy?: string;
  accessCount: number;
  dataRetentionDate?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function SecurityManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clearances, setClearances] = useState<SecurityClearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClearance, setSelectedClearance] =
    useState<SecurityClearance | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchSecurityClearances();
  }, [session, router, mounted]);

  const fetchSecurityClearances = async () => {
    try {
      const response = await fetch("/api/security/clearances");
      if (response.ok) {
        const data = await response.json();
        setClearances(data.clearances || []);
      } else {
        toast.error("Failed to load security clearances");
      }
    } catch (error) {
      console.error("Error fetching clearances:", error);
      toast.error("Error loading security data");
    } finally {
      setLoading(false);
    }
  };

  const verifyTaxInformation = async (userId: string) => {
    try {
      const response = await fetch(`/api/security/tax-info/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success("Tax information verified");
        fetchSecurityClearances();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to verify tax information");
      }
    } catch (error) {
      console.error("Error verifying tax info:", error);
      toast.error("Error verifying tax information");
    }
  };

  const deleteTaxInformation = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this tax information? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/security/tax-info?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tax information deleted");
        fetchSecurityClearances();
        setSelectedClearance(null);
        setShowDetails(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete tax information");
      }
    } catch (error) {
      console.error("Error deleting tax info:", error);
      toast.error("Error deleting tax information");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const isRetentionDue = (retentionDate?: string) => {
    if (!retentionDate) return false;
    return new Date(retentionDate) <= new Date();
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold">Security Management</h1>
              <p className="text-gray-400">
                Manage sensitive tax information and security clearances
              </p>
            </div>
          </div>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Restricted Access Area
              </span>
            </div>
          </div>
        </div>

        {/* Security Clearances Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold">
              Tax Information Security Clearances
            </h2>
            <p className="text-gray-400 mt-1">
              {clearances.length} active security clearances
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Tax ID</th>
                  <th className="text-left p-4 font-medium">Business</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Last Access</th>
                  <th className="text-left p-4 font-medium">Retention</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clearances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-400">
                      No security clearances found
                    </td>
                  </tr>
                ) : (
                  clearances.map((clearance) => (
                    <tr
                      key={clearance.id}
                      className="border-t border-gray-600 hover:bg-gray-700/50"
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {clearance.user?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {clearance.user?.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono">
                          {clearance.taxIdType}: ****{clearance.taxIdLastFour}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-sm">
                            {clearance.businessName || "N/A"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {clearance.businessType}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {clearance.isVerified ? (
                            <div className="flex items-center space-x-1 text-green-400">
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">Pending</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {formatDateTime(clearance.lastAccessedAt)}
                          <div className="text-xs text-gray-400">
                            {clearance.accessCount} total accesses
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          className={`text-sm ${
                            isRetentionDue(clearance.dataRetentionDate)
                              ? "text-red-400"
                              : "text-gray-400"
                          }`}
                        >
                          {formatDate(clearance.dataRetentionDate)}
                          {isRetentionDue(clearance.dataRetentionDate) && (
                            <div className="text-xs text-red-400">
                              Retention due
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClearance(clearance);
                              setShowDetails(true);
                            }}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!clearance.isVerified && (
                            <button
                              type="button"
                              onClick={() =>
                                verifyTaxInformation(clearance.userId)
                              }
                              className="p-2 text-green-400 hover:text-white hover:bg-green-600 rounded transition-colors"
                              title="Verify Tax Information"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              deleteTaxInformation(clearance.userId)
                            }
                            className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded transition-colors"
                            title="Delete Tax Information"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetails && selectedClearance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    Security Clearance Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">User</label>
                    <div className="text-white">
                      {selectedClearance.user?.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {selectedClearance.user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Tax ID</label>
                    <div className="font-mono text-white">
                      {selectedClearance.taxIdType}: ****
                      {selectedClearance.taxIdLastFour}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">
                      Business Name
                    </label>
                    <div className="text-white">
                      {selectedClearance.businessName || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">
                      Business Type
                    </label>
                    <div className="text-white">
                      {selectedClearance.businessType || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">
                      Verification Status
                    </label>
                    <div
                      className={`${
                        selectedClearance.isVerified
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {selectedClearance.isVerified
                        ? "Verified"
                        : "Pending Verification"}
                    </div>
                    {selectedClearance.verifiedAt && (
                      <div className="text-xs text-gray-400">
                        Verified on{" "}
                        {formatDateTime(selectedClearance.verifiedAt)}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">
                      Data Retention
                    </label>
                    <div
                      className={`${
                        isRetentionDue(selectedClearance.dataRetentionDate)
                          ? "text-red-400"
                          : "text-white"
                      }`}
                    >
                      {formatDate(selectedClearance.dataRetentionDate)}
                    </div>
                    {isRetentionDue(selectedClearance.dataRetentionDate) && (
                      <div className="text-xs text-red-400">
                        Retention period expired
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-lg font-medium mb-4">Access History</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">
                        Total Accesses
                      </label>
                      <div className="text-white">
                        {selectedClearance.accessCount}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">
                        Last Accessed
                      </label>
                      <div className="text-white">
                        {formatDateTime(selectedClearance.lastAccessedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-lg font-medium mb-4">
                    Record Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Created</label>
                      <div className="text-white">
                        {formatDateTime(selectedClearance.createdAt)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">
                        Last Updated
                      </label>
                      <div className="text-white">
                        {formatDateTime(selectedClearance.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
