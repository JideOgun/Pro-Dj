// Centralized status utilities for consistent styling across the app

export const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-900/40 text-yellow-200 border-yellow-700/30";
    case "ACCEPTED":
      return "bg-blue-900/40 text-blue-200 border-blue-700/30";
    case "CONFIRMED":
      return "bg-green-900/40 text-green-200 border-green-700/30";
    case "DECLINED":
      return "bg-red-900/40 text-red-200 border-red-700/30";
    default:
      return "bg-gray-800 text-gray-200 border-gray-600/30";
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "ACCEPTED":
      return "ACCEPTED";
    case "CONFIRMED":
      return "CONFIRMED";
    case "DECLINED":
      return "DECLINED";
    default:
      return status;
  }
};

export const getPaymentStatusText = (status: string) => {
  switch (status) {
    case "PENDING":
      return "NOT PAID";
    case "ACCEPTED":
      return "NOT PAID";
    case "CONFIRMED":
      return "PAID";
    case "DECLINED":
      return "NOT PAID";
    default:
      return "NOT PAID";
  }
};

// Status icons for consistent display
export const getStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return "⏳";
    case "ACCEPTED":
      return "✅";
    case "CONFIRMED":
      return "💰";
    case "DECLINED":
      return "❌";
    default:
      return "•";
  }
};

// Payment status icons for client view
export const getPaymentStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return "❌"; // Red X for NOT PAID
    case "ACCEPTED":
      return "❌"; // Red X for NOT PAID
    case "CONFIRMED":
      return "✅"; // Green checkmark for PAID
    case "DECLINED":
      return "❌"; // Red X for NOT PAID
    default:
      return "❌"; // Red X for NOT PAID
  }
};

// Payment status utilities for DJ view (based on isPaid field and refund status)
export const getDjPaymentStatusText = (
  isPaid: boolean,
  refundId?: string | null
) => {
  if (refundId) return "REFUNDED";
  return isPaid ? "PAID" : "NOT PAID";
};

export const getDjPaymentStatusColor = (
  isPaid: boolean,
  refundId?: string | null
) => {
  if (refundId) return "bg-orange-900/40 text-orange-200 border-orange-700/30";
  return isPaid
    ? "bg-green-900/40 text-green-200 border-green-700/30"
    : "bg-red-900/40 text-red-200 border-red-700/30";
};

export const getDjPaymentStatusIcon = (
  isPaid: boolean,
  refundId?: string | null
) => {
  if (refundId) return "🔄";
  return isPaid ? "✅" : "❌";
};

// Client payment status utilities (for refunded bookings)
export const getClientPaymentStatusText = (
  status: string,
  refundId?: string | null
) => {
  if (refundId) return "PAYMENT REFUNDED";
  switch (status) {
    case "PENDING":
      return "NOT PAID";
    case "ACCEPTED":
      return "NOT PAID";
    case "CONFIRMED":
      return "PAID";
    case "DECLINED":
      return refundId ? "PAYMENT REFUNDED" : "NOT PAID";
    default:
      return refundId ? "PAYMENT REFUNDED" : "NOT PAID";
  }
};

export const getClientPaymentStatusColor = (
  status: string,
  refundId?: string | null
) => {
  if (refundId) return "bg-orange-900/40 text-orange-200 border-orange-700/30";
  switch (status) {
    case "PENDING":
      return "bg-red-900/40 text-red-200 border-red-700/30";
    case "ACCEPTED":
      return "bg-red-900/40 text-red-200 border-red-700/30";
    case "CONFIRMED":
      return "bg-green-900/40 text-green-200 border-green-700/30";
    case "DECLINED":
      return refundId
        ? "bg-orange-900/40 text-orange-200 border-orange-700/30"
        : "bg-red-900/40 text-red-200 border-red-700/30";
    default:
      return refundId
        ? "bg-orange-900/40 text-orange-200 border-orange-700/30"
        : "bg-red-900/40 text-red-200 border-red-700/30";
  }
};

export const getClientPaymentStatusIcon = (
  status: string,
  refundId?: string | null
) => {
  if (refundId) return "🔄";
  switch (status) {
    case "PENDING":
      return "❌";
    case "ACCEPTED":
      return "❌";
    case "CONFIRMED":
      return "✅";
    case "DECLINED":
      return refundId ? "🔄" : "❌";
    default:
      return refundId ? "🔄" : "❌";
  }
};
