// Centralized status utilities for consistent styling across the app

export const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING_ADMIN_REVIEW_ADMIN_REVIEW":
      return "bg-yellow-900/40 text-yellow-200 border-yellow-700/30";
    case "ADMIN_REVIEWING":
      return "bg-orange-900/40 text-orange-200 border-orange-700/30";
    case "DJ_ASSIGNED":
      return "bg-blue-900/40 text-blue-200 border-blue-700/30";
    case "CONFIRMED":
      return "bg-green-900/40 text-green-200 border-green-700/30";
    case "CANCELLED":
      return "bg-red-900/40 text-red-200 border-red-700/30";
    default:
      return "bg-gray-800 text-gray-200 border-gray-600/30";
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case "PENDING_ADMIN_REVIEW_ADMIN_REVIEW":
      return "PENDING_ADMIN_REVIEW_ADMIN_REVIEW";
    case "ADMIN_REVIEWING":
      return "ADMIN_REVIEWING";
    case "DJ_ASSIGNED":
      return "DJ_ASSIGNED";
    case "CONFIRMED":
      return "CONFIRMED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return status;
  }
};

export const getPaymentStatusText = (status: string) => {
  switch (status) {
    case "PENDING_ADMIN_REVIEW":
      return "NOT PAID";
    case "DJ_ASSIGNED":
      return "NOT PAID";
    case "CONFIRMED":
      return "PAID";
    case "CANCELLED":
      return "NOT PAID";
    default:
      return "NOT PAID";
  }
};

// Status icons for consistent display
export const getStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING_ADMIN_REVIEW":
      return "⏳";
    case "DJ_ASSIGNED":
      return "✅";
    case "CONFIRMED":
      return "💰";
    case "CANCELLED":
      return "❌";
    default:
      return "•";
  }
};

// Payment status icons for client view
export const getPaymentStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING_ADMIN_REVIEW":
      return "❌"; // Red X for NOT PAID
    case "DJ_ASSIGNED":
      return "❌"; // Red X for NOT PAID
    case "CONFIRMED":
      return "✅"; // Green checkmark for PAID
    case "CANCELLED":
      return "❌"; // Red X for NOT PAID
    default:
      return "❌"; // Red X for NOT PAID
  }
};

// Payment status utilities for DJ view (based on isPaid field and refund status)
export const getDjPaymentStatusText = (
  isPaid: boolean,
  refundId?: string | null,
) => {
  if (refundId) return "REFUNDED";
  return isPaid ? "PAID" : "NOT PAID";
};

export const getDjPaymentStatusColor = (
  isPaid: boolean,
  refundId?: string | null,
) => {
  if (refundId) return "bg-orange-900/40 text-orange-200 border-orange-700/30";
  return isPaid
    ? "bg-green-900/40 text-green-200 border-green-700/30"
    : "bg-red-900/40 text-red-200 border-red-700/30";
};

export const getDjPaymentStatusIcon = (
  isPaid: boolean,
  refundId?: string | null,
) => {
  if (refundId) return "🔄";
  return isPaid ? "✅" : "❌";
};

// Client payment status utilities (based on isPaid field from Stripe, not status)
export const getClientPaymentStatusText = (
  isPaid: boolean,
  refundId?: string | null,
) => {
  if (refundId) return "PAYMENT REFUNDED";
  return isPaid ? "PAID" : "NOT PAID";
};

export const getClientPaymentStatusColor = (
  isPaid: boolean,
  refundId?: string | null,
) => {
  if (refundId) return "bg-orange-900/40 text-orange-200 border-orange-700/30";
  return isPaid
    ? "bg-green-900/40 text-green-200 border-green-700/30"
    : "bg-red-900/40 text-red-200 border-red-700/30";
};

export const getClientPaymentStatusIcon = (
  isPaid: boolean,
  refundId?: string | null,
) => {
  if (refundId) return "🔄";
  return isPaid ? "✅" : "❌";
};
