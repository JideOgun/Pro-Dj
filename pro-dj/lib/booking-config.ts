export type BookingType = "Wedding" | "Club Night" | "Corporate" | "Birthday" | "Private Party";

export const BOOKING_CONFIG = {
  "Wedding": {
    packages: [
      { key: "silver", label: "Silver (3 hrs + MC)", priceCents: 80000 },
      { key: "gold",   label: "Gold (5 hrs + MC + Lights)", priceCents: 120000 },
      { key: "platinum", label: "Platinum (All-day, Ceremony+Reception)", priceCents: 180000 },
    ],
    extraFields: ["venueName", "guestCount"], // simple identifiers
  },
  "Club Night": {
    packages: [
      { key: "2hr",  label: "2 hours", priceCents: 30000 },
      { key: "3hr",  label: "3 hours", priceCents: 40000 },
      { key: "4hr",  label: "4 hours", priceCents: 50000 },
    ],
    extraFields: ["clubName"],
  },
  "Corporate": {
    packages: [
      { key: "halfday", label: "Half-day (4 hrs)", priceCents: 90000 },
      { key: "fullday", label: "Full-day (8 hrs)", priceCents: 150000 },
    ],
    extraFields: ["companyName"],
  },
  "Birthday": {
    packages: [
      { key: "standard", label: "Standard (3 hrs)", priceCents: 60000 },
    ],
    extraFields: ["ageIfKids"],
  },
  "Private Party": {
    packages: [
      { key: "house", label: "House Party (3 hrs)", priceCents: 50000 },
    ],
    extraFields: [],
  },
} as const;
