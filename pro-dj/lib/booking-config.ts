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
    extraFields: ["venueName", "guestCount", "ceremonyTime", "receptionTime"],
    recommendedAddons: [
      "lighting",
      "setup",
      "mc",
      "Wedding Planning Consultation",
      "Wireless Decor Uplighting",
      "Photo Booth Integration",
    ], // Premium wedding services
  },
  Corporate: {
    extraFields: ["companyName", "eventPurpose", "attendeeCount"],
    recommendedAddons: [
      "setup",
      "mc",
      "Corporate Presentation Support",
      "Projector & Slideshow",
      "Wireless Decor Uplighting",
    ], // Premium corporate services
  },
  "Private Party": {
    extraFields: ["partyType", "guestCount", "venueType"],
    recommendedAddons: [
      "lighting",
      "setup",
      "Custom Playlist Creation",
      "Wireless Decor Uplighting",
      "Karaoke Setup",
    ], // Premium private party services
  },
  Birthday: {
    extraFields: ["age", "partyTheme", "guestCount"],
    recommendedAddons: [
      "lighting",
      "setup",
      "Karaoke Setup",
      "Wireless Decor Uplighting",
      "Song Customization",
    ], // Premium birthday services
  },
  Club: {
    extraFields: ["clubName"],
    recommendedAddons: ["setup"], // Clubs have their own equipment
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
