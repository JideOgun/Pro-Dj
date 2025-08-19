export type BookingType =
  | "Wedding"
  | "Club"
  | "Corporate"
  | "Birthday"
  | "Private Party";

export const BOOKING_CONFIG = {
  Wedding: {
    packages: [
      { key: "silver", label: "Silver (3 hrs + MC)", priceCents: 80000 },
      { key: "gold", label: "Gold (5 hrs + MC + Lights)", priceCents: 120000 },
      {
        key: "platinum",
        label: "Platinum (All-day, Ceremony+Reception)",
        priceCents: 180000,
      },
    ],
    extraFields: ["venueName", "guestCount"], // simple identifiers
  },
  Club: {
    packages: [
      { key: "2hr", label: "2 hours", priceCents: 30000 },
      { key: "3hr", label: "3 hours", priceCents: 40000 },
      { key: "4hr", label: "4 hours", priceCents: 50000 },
    ],
    extraFields: ["clubName"],
  },
  Corporate: {
    packages: [
      { key: "halfday", label: "Half-day (4 hrs)", priceCents: 90000 },
      { key: "fullday", label: "Full-day (8 hrs)", priceCents: 150000 },
    ],
    extraFields: ["companyName"],
  },
  Birthday: {
    packages: [
      {
        key: "birthday_basic",
        label: "Basic Birthday Package (2 hours)",
        priceCents: 20000,
      },
      {
        key: "birthday_premium",
        label: "Premium Birthday Package (4 hours, lighting)",
        priceCents: 40000,
      },
    ],
    extraFields: ["age"],
  },
  "Private Party": {
    packages: [
      {
        key: "private_basic",
        label: "Basic Private Party (3 hours)",
        priceCents: 50000,
      },
      {
        key: "private_vip",
        label: "VIP Private Party (5 hours, lighting + MC)",
        priceCents: 50000,
      },
    ],
    extraFields: [],
  },
} as const;
