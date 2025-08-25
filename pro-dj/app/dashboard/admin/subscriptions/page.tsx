"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Crown,
  Calendar,
  DollarSign,
  User,
  Search,
  Filter,
  MoreVertical,
  Eye,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Plus,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planType: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amountCents: number;
  currency: string;
  isInTrial: boolean;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    djProfile?: {
      stageName: string;
    };
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  djProfile?: {
    stageName: string;
  };
  subscription?: {
    id: string;
    status: string;
  };
}

export default function AdminSubscriptionsPage() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [granting, setGranting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("DJ_BASIC");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subscriptionsResponse, usersResponse] = await Promise.all([
        fetch("/api/admin/subscriptions"),
        fetch("/api/admin/users"),
      ]);

      if (subscriptionsResponse.ok) {
        const data = await subscriptionsResponse.json();
        setSubscriptions(data.subscriptions);
      }

      if (usersResponse.ok) {
        const data = await usersResponse.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string, reason: string) => {
    try {
      setCancelling(subscriptionId);
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        toast.success("Subscription cancelled successfully");
        fetchData(); // Refresh the data
        setShowDetails(false);
        setSelectedSubscription(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setCancelling(null);
    }
  };

  const grantSubscription = async () => {
    if (!selectedUser) return;

    try {
      setGranting(true);
      const response = await fetch("/api/admin/subscriptions/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          planType: selectedPlan,
        }),
      });

      if (response.ok) {
        toast.success(
          `Subscription granted to ${selectedUser.name || selectedUser.email}`
        );
        fetchData(); // Refresh the data
        setShowGrantModal(false);
        setSelectedUser(null);
        setSelectedPlan("DJ_BASIC");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to grant subscription");
      }
    } catch (error) {
      console.error("Error granting subscription:", error);
      toast.error("Failed to grant subscription");
    } finally {
      setGranting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "TRIAL":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PAST_DUE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "UNPAID":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case "DJ_BASIC":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DJ_PRO":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "DJ_PREMIUM":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amountCents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user.djProfile?.stageName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesPlan = planFilter === "all" || sub.planType === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Filter users who don't have active subscriptions
  const usersWithoutSubscriptions = users.filter(
    (user) =>
      user.role === "DJ" &&
      (!user.subscription ||
        (user.subscription.status !== "ACTIVE" &&
          user.subscription.status !== "TRIAL"))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
          <p className="text-gray-400">
            Manage user subscriptions, grant access, and handle cancellations
          </p>
        </div>

        {/* Grant Subscription Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowGrantModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Grant Subscription
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by email, name, or stage name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Active (Trial)</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Plan</label>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">All Plans</option>
                <option value="DJ_BASIC">DJ Basic ($5/month)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-violet-500 mr-4" />
              <div>
                <p className="text-gray-400 text-sm">Total Subscriptions</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <Check className="w-8 h-8 text-green-500 mr-4" />
              <div>
                <p className="text-gray-400 text-sm">Active</p>
                <p className="text-2xl font-bold">
                  {
                    subscriptions.filter(
                      (s) => s.status === "ACTIVE" || s.status === "TRIAL"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <X className="w-8 h-8 text-red-500 mr-4" />
              <div>
                <p className="text-gray-400 text-sm">Cancelled</p>
                <p className="text-2xl font-bold">
                  {subscriptions.filter((s) => s.status === "CANCELLED").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-yellow-500 mr-4" />
              <div>
                <p className="text-gray-400 text-sm">Monthly Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    subscriptions
                      .filter(
                        (s) => s.status === "ACTIVE" || s.status === "TRIAL"
                      )
                      .reduce((sum, s) => sum + s.amountCents, 0),
                    "usd"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredSubscriptions.map((subscription) => (
                  <motion.tr
                    key={subscription.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {subscription.user.djProfile?.stageName ||
                            subscription.user.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {subscription.user.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {subscription.user.role}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPlanColor(
                          subscription.planType
                        )}`}
                      >
                        {subscription.planType === "DJ_BASIC"
                          ? "DJ Basic ($5/month)"
                          : subscription.planType.replace("DJ_", "")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status === "TRIAL"
                          ? "ACTIVE (Trial)"
                          : subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatCurrency(
                        subscription.amountCents,
                        subscription.currency
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div>
                        <div>
                          Start: {formatDate(subscription.currentPeriodStart)}
                        </div>
                        <div>
                          End: {formatDate(subscription.currentPeriodEnd)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowDetails(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(subscription.status === "ACTIVE" ||
                          subscription.status === "TRIAL") && (
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowDetails(true);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No subscriptions found
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== "all" || planFilter !== "all"
                ? "Try adjusting your filters"
                : "No subscriptions have been created yet"}
            </p>
          </div>
        )}
      </div>

      {/* Grant Subscription Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Grant Subscription</h2>
                <button
                  onClick={() => {
                    setShowGrantModal(false);
                    setSelectedUser(null);
                    setSelectedPlan("DJ_BASIC");
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select DJ User
                  </label>
                  <select
                    value={selectedUser?.id || ""}
                    onChange={(e) => {
                      const user = users.find((u) => u.id === e.target.value);
                      setSelectedUser(user || null);
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select a DJ user...</option>
                    {usersWithoutSubscriptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.djProfile?.stageName || user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Plan</label>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-300">
                          DJ Basic Plan
                        </h3>
                        <p className="text-sm text-gray-400">
                          Unlimited uploads, booking acceptance, and all premium
                          features
                        </p>
                      </div>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs font-medium rounded-full">
                        $5/month
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setShowGrantModal(false);
                      setSelectedUser(null);
                      setSelectedPlan("DJ_BASIC");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={grantSubscription}
                    disabled={!selectedUser || granting}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    {granting ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Crown className="w-4 h-4 mr-2" />
                    )}
                    {granting ? "Granting..." : "Grant Subscription"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Subscription Details Modal */}
      {showDetails && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Subscription Details</h2>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedSubscription(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-300 mb-2">
                    User Information
                  </h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p>
                      <strong>Name:</strong> {selectedSubscription.user.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedSubscription.user.email}
                    </p>
                    <p>
                      <strong>Role:</strong> {selectedSubscription.user.role}
                    </p>
                    {selectedSubscription.user.djProfile?.stageName && (
                      <p>
                        <strong>Stage Name:</strong>{" "}
                        {selectedSubscription.user.djProfile.stageName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-300 mb-2">
                    Subscription Information
                  </h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p>
                      <strong>Plan:</strong> {selectedSubscription.planType}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {selectedSubscription.status === "TRIAL"
                        ? "ACTIVE (Trial)"
                        : selectedSubscription.status}
                    </p>
                    <p>
                      <strong>Amount:</strong>{" "}
                      {formatCurrency(
                        selectedSubscription.amountCents,
                        selectedSubscription.currency
                      )}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedSubscription.createdAt)}
                    </p>
                    <p>
                      <strong>Current Period:</strong>{" "}
                      {formatDate(selectedSubscription.currentPeriodStart)} -{" "}
                      {formatDate(selectedSubscription.currentPeriodEnd)}
                    </p>
                    {selectedSubscription.isInTrial &&
                      selectedSubscription.trialEnd && (
                        <p>
                          <strong>Trial Ends:</strong>{" "}
                          {formatDate(selectedSubscription.trialEnd)}
                        </p>
                      )}
                    {selectedSubscription.cancelledAt && (
                      <p>
                        <strong>Cancelled:</strong>{" "}
                        {formatDate(selectedSubscription.cancelledAt)}
                      </p>
                    )}
                    {selectedSubscription.cancelReason && (
                      <p>
                        <strong>Cancel Reason:</strong>{" "}
                        {selectedSubscription.cancelReason}
                      </p>
                    )}
                  </div>
                </div>

                {(selectedSubscription.status === "ACTIVE" ||
                  selectedSubscription.status === "TRIAL") && (
                  <div>
                    <h3 className="font-medium text-gray-300 mb-2">Actions</h3>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-4">
                        Cancelling a subscription will immediately revoke the
                        user's access to premium features.
                      </p>
                      <button
                        onClick={() => {
                          const reason = prompt("Enter cancellation reason:");
                          if (reason) {
                            cancelSubscription(selectedSubscription.id, reason);
                          }
                        }}
                        disabled={cancelling === selectedSubscription.id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                      >
                        {cancelling === selectedSubscription.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        {cancelling === selectedSubscription.id
                          ? "Cancelling..."
                          : "Cancel Subscription"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
