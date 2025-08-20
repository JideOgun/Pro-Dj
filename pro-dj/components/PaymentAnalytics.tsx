"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  BarChart3,
  PieChart,
} from "lucide-react";
import toast from "react-hot-toast";

interface PaymentAnalytics {
  period: {
    start: string;
    end: string;
    days: number;
  };
  payments: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
    totalAmount: number;
    totalRefunded: number;
    netAmount: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    accepted: number;
    declined: number;
    conversionRate: number;
  };
  paymentMethods: Record<string, number>;
  dailyPayments: Record<string, number>;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    created: number;
    currency: string;
    paymentMethod: string;
  }>;
  paymentErrors: Array<{
    id: string;
    error: string;
    code: string;
    created: number;
  }>;
  refunds: {
    total: number;
    totalAmount: number;
    recent: Array<{
      id: string;
      amount: number;
      reason: string;
      status: string;
      created: number;
    }>;
  };
}

export default function PaymentAnalytics() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/stripe/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to load payment analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchAnalytics();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
          <span className="ml-3 text-gray-300">
            Loading payment analytics...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <span className="ml-3 text-gray-300">{error}</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
          <h4 className="text-lg font-medium mb-2">
            No payment data available
          </h4>
          <p className="text-gray-300">
            Payment analytics will appear here once you have processed payments.
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-violet-400 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Payment Analytics
          </h3>
          <p className="text-gray-400 text-sm">
            Last {analytics.period.days} days •{" "}
            {new Date(analytics.period.start).toLocaleDateString()} -{" "}
            {new Date(analytics.period.end).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Payment Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(analytics.payments.netAmount)}
              </div>
              <div className="text-gray-300 text-sm">Net Revenue</div>
            </div>
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {analytics.payments.successRate.toFixed(1)}%
              </div>
              <div className="text-gray-300 text-sm">Success Rate</div>
            </div>
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-900/30 to-violet-800/30 border border-violet-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-violet-400">
                {analytics.payments.successful}
              </div>
              <div className="text-gray-300 text-sm">Successful</div>
            </div>
            <CheckCircle className="w-6 h-6 text-violet-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-400">
                {analytics.payments.failed}
              </div>
              <div className="text-gray-300 text-sm">Failed</div>
            </div>
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Payment Methods
          </h4>
          {Object.keys(analytics.paymentMethods).length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mb-4 mx-auto" />
              <p className="text-gray-300">No payment method data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics.paymentMethods).map(
                ([method, count]) => (
                  <div
                    key={method}
                    className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-violet-400" />
                      <span className="font-medium capitalize">{method}</span>
                    </div>
                    <span className="text-violet-400 font-semibold">
                      {count}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Booking Conversion */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Booking Conversion
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Conversion Rate</span>
              <span className="text-green-400 font-semibold">
                {analytics.bookings.conversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {analytics.bookings.confirmed}
                </div>
                <div className="text-gray-300 text-sm">Confirmed</div>
              </div>
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {analytics.bookings.pending}
                </div>
                <div className="text-gray-300 text-sm">Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold mb-4 text-violet-400">
          Recent Payments
        </h4>
        {analytics.recentPayments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mb-4 mx-auto" />
            <p className="text-gray-300">No recent payments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="p-3 text-gray-300">Date</th>
                  <th className="p-3 text-gray-300">Amount</th>
                  <th className="p-3 text-gray-300">Method</th>
                  <th className="p-3 text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-700/50">
                    <td className="p-3 text-sm">
                      {formatDate(payment.created)}
                    </td>
                    <td className="p-3 font-medium text-green-400">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="p-3 text-sm capitalize">
                      {payment.paymentMethod}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-900/40 text-green-200 border border-green-700/30">
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Errors */}
      {analytics.paymentErrors.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Payment Errors ({analytics.paymentErrors.length})
          </h4>
          <div className="space-y-3">
            {analytics.paymentErrors.slice(0, 5).map((error) => (
              <div
                key={error.id}
                className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-red-300 font-medium">
                    {error.code}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(error.created)}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{error.error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refunds */}
      {analytics.refunds.total > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-orange-400">
            Recent Refunds ({analytics.refunds.total})
          </h4>
          <div className="space-y-3">
            {analytics.refunds.recent.map((refund) => (
              <div
                key={refund.id}
                className="flex items-center justify-between p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg"
              >
                <div>
                  <div className="font-medium text-orange-300">
                    {formatCurrency(refund.amount)}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">
                    {refund.reason}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-900/40 text-orange-200 border border-orange-700/30">
                    {refund.status}
                  </span>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(refund.created)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
