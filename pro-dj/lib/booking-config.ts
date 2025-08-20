export type BookingType =
  | "Wedding"
  | "Club"
  | "Corporate"
  | "Birthday"
  | "Private Party";

export type AddonType =
  | "lighting"
  | "setup"
  | "mc"
  | "photography"
  | "videography";

export interface Addon {
  key: AddonType;
  label: string;
  description: string;
  priceCents: number; // Fixed price addon (not hourly)
}

export const AVAILABLE_ADDONS: Addon[] = [
  {
    key: "lighting",
    label: "Professional Lighting Setup",
    description:
      "Advanced lighting effects, LED panels, and atmosphere lighting",
    priceCents: 15000, // $150 flat fee
  },
  {
    key: "setup",
    label: "Premium Setup & Equipment",
    description: "Professional-grade speakers, subwoofers, and sound system",
    priceCents: 25000, // $250 flat fee
  },
  {
    key: "mc",
    label: "MC Services",
    description:
      "Professional Master of Ceremonies for announcements and crowd engagement",
    priceCents: 50000, // $500 flat fee
  },
  {
    key: "photography",
    label: "Event Photography",
    description: "Professional event photography coverage",
    priceCents: 75000, // $750 flat fee
  },
  {
    key: "videography",
    label: "Event Videography",
    description: "Professional event videography and highlights reel",
    priceCents: 100000, // $1000 flat fee
  },
];

export const BOOKING_CONFIG = {
  Wedding: {
    extraFields: ["venueName", "guestCount"],
    recommendedAddons: ["lighting", "setup", "mc"], // Suggested for weddings
  },
  Club: {
    extraFields: ["clubName"],
    recommendedAddons: ["setup"], // Clubs often need premium equipment
  },
  Corporate: {
    extraFields: ["companyName"],
    recommendedAddons: ["setup", "mc"], // Corporate events often need MC
  },
  Birthday: {
    extraFields: ["age"],
    recommendedAddons: ["lighting"], // Lighting adds to party atmosphere
  },
  "Private Party": {
    extraFields: [],
    recommendedAddons: ["lighting", "setup"], // Depends on venue
  },
} as const;

// Helper function to get addon by key
export const getAddonByKey = (key: AddonType): Addon | undefined => {
  return AVAILABLE_ADDONS.find((addon) => addon.key === key);
};

// Helper function to calculate total price
export const calculateTotalPrice = (
  djHourlyRateCents: number,
  durationHours: number,
  selectedAddons: AddonType[]
): number => {
  const basePrice = djHourlyRateCents * durationHours;
  const addonPrice = selectedAddons.reduce((total, addonKey) => {
    const addon = getAddonByKey(addonKey);
    return total + (addon?.priceCents || 0);
  }, 0);

  return basePrice + addonPrice;
};
