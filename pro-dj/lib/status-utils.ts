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
