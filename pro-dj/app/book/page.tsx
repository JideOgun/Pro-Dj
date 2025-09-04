"use client";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { BOOKING_CONFIG, type BookingType } from "@/lib/booking-config";
import toast from "react-hot-toast";
import {
  Music,
  Check,
  AlertTriangle,
  Plus,
  DollarSign,
  X,
  ChevronDown,
} from "lucide-react";

function BookPageContent() {
  const { data } = useSession();
  const loggedIn = !!data?.user;
  const params = useSearchParams();
  const router = useRouter();

  // Basic form state
  const [bookingType, setBookingType] = useState<BookingType | "">("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [musicStyle, setMusicStyle] = useState("");
  const [clientEquipment, setClientEquipment] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});

  // Pro-DJ standardized add-ons system
  const [proDjAddons, setProDjAddons] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      priceFixed: number | null;
      pricePerHour: number | null;
      requiresSpecialEquipment: boolean;
      totalPrice: number;
    }>
  >([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Pro-DJ pricing state
  const [proDjPricing, setProDjPricing] = useState<{
    basePriceCents: number;
    addonPriceCents: number;
    totalPriceCents: number;
    eventType: string;
    durationHours: number;
    billableHours: number;
    basePricePerHour: number;
    minimumHours: number;
  } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Package selection state
  const [selectedPackage, setSelectedPackage] = useState<{
    id: string;
    packageType: string;
    packageName: string;
    basePriceCents: number;
    durationHours: number;
    description: string;
    includedAddons: string[];
  } | null>(null);
  const [availablePackages, setAvailablePackages] = useState<
    Array<{
      id: string;
      packageType: string;
      packageName: string;
      basePriceCents: number;
      durationHours: number;
      description: string;
      includedAddons: string[];
    }>
  >([]);

  // DJ preference (optional) - client can express preference but admin assigns
  const [preferredDj, setPreferredDj] = useState<{
    djId: string;
    stageName: string;
  } | null>(null);
  const [availableDjs, setAvailableDjs] = useState<
    Array<{
      id: string;
      stageName: string;
      user: { name: string };
      rating: number;
      totalBookings: number;
      bio?: string;
      specialties?: string;
      genres?: string[];
    }>
  >([]);

  // Simple selectedDjs array for backward compatibility (Pro-DJ model)
  const selectedDjs = preferredDj
    ? [
        {
          djId: preferredDj.djId,
          dj: { stageName: preferredDj.stageName },
          startTime: startTime,
          endTime: endTime,
        },
      ]
    : [];

  const [djs, setDjs] = useState<
    Array<{
      id: string;
      stageName: string;
      genres: string[];

      eventsOffered?: string[];
      bio?: string;
      specialties?: string;
      location?: string;
      isFeatured?: boolean;
      rating?: number;
      reviewCount?: number;
      eventPricing?: Array<{
        eventType: string;
        hourlyRateCents: number;
        description: string | null;
      }>;
    }>
  >([]);

  // UI state
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [djSearchTerm, setDjSearchTerm] = useState("");
  const [isLoadingDjs, setIsLoadingDjs] = useState(true);

  const typeConfig = bookingType ? BOOKING_CONFIG[bookingType] : null;

  // Available genres for selection
  const availableGenres = [
    "Afrobeats",
    "Amapiano",
    "Hip-Hop",
    "R&B",
    "Pop",
    "Rock",
    "Electronic",
    "House",
    "Techno",
    "Reggae",
    "Dancehall",
    "Jazz",
    "Blues",
    "Country",
    "Classical",
    "Latin",
    "Caribbean",
    "Gospel",
    "Soul",
    "Funk",
    "Disco",
  ];

  // Calculate event duration
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (duration < 0) duration += 24; // Handle overnight events
    return Math.round(duration * 100) / 100;
  };

  // Calculate individual DJ duration
  const calculateDjDuration = (
    djStartTime: string,
    djEndTime: string
  ): number => {
    if (!djStartTime || !djEndTime) return 0;
    const start = new Date(`2000-01-01T${djStartTime}`);
    const end = new Date(`2000-01-01T${djEndTime}`);
    let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (duration < 0) duration += 24; // Handle overnight events
    return Math.round(duration * 100) / 100;
  };

  const totalEventDuration = calculateDuration(startTime, endTime);

  // Get the hourly rate for a DJ for a specific event type
  const getDjHourlyRate = (
    dj: {
      eventPricing?: Array<{
        eventType: string;
        hourlyRateCents: number;
        description: string | null;
      }>;
    },
    eventType: string
  ): number => {
    const eventPricing = dj.eventPricing?.find(
      (pricing) => pricing.eventType === eventType
    );
    return eventPricing?.hourlyRateCents || 0;
  };

  // Load available packages for the selected event type
  const loadAvailablePackages = async () => {
    if (!bookingType) {
      setAvailablePackages([]);
      setSelectedPackage(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/pricing/pro-dj?eventType=${bookingType}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailablePackages(data.packages || []);

        // Auto-select the first package if none selected
        if (data.packages && data.packages.length > 0 && !selectedPackage) {
          handlePackageSelection(data.packages[0]);
        }
      }
    } catch (error) {
      console.error("Error loading packages:", error);
    }
  };

  // Handle package selection with end time calculation
  const handlePackageSelection = (pkg: {
    id: string;
    packageType: string;
    packageName: string;
    durationHours: number;
    includedAddons: string[];
  }) => {
    console.log("Package selected:", pkg);
    setSelectedPackage(pkg);

    // If start time is already set and this is a package-based event, calculate end time
    if (startTime && pkg.durationHours) {
      calculateEndTimeFromPackage(startTime, pkg);
    }
  };

  // Calculate end time based on start time and package duration
  const calculateEndTimeFromPackage = (
    startTimeValue: string,
    pkg: {
      id: string;
      packageType: string;
      packageName: string;
      durationHours: number;
      includedAddons: string[];
    }
  ) => {
    console.log("Calculating end time from package:", {
      startTime: startTimeValue,
      packageDuration: pkg.durationHours,
      packageName: pkg.packageName,
    });

    // Parse start time (format: HH:MM)
    const [hours, minutes] = startTimeValue.split(":").map(Number);
    const startTimeDate = new Date();
    startTimeDate.setHours(hours, minutes, 0, 0);

    // Add package duration
    const endTimeDate = new Date(
      startTimeDate.getTime() + pkg.durationHours * 60 * 60 * 1000
    );

    // Format as HH:MM
    const endTimeString = endTimeDate.toTimeString().slice(0, 5);
    console.log("Calculated end time:", endTimeString);
    setEndTime(endTimeString);
  };

  // Handle start time change with end time calculation
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);

    // If a package is selected and it has duration, calculate end time
    if (selectedPackage && selectedPackage.durationHours) {
      calculateEndTimeFromPackage(newStartTime, selectedPackage);
    }
  };

  // Calculate Pro-DJ standardized pricing
  const calculateProDjPricing = async () => {
    if (!bookingType || !selectedPackage) {
      setProDjPricing(null);
      return;
    }

    // Ensure we have proper date/time format
    const dateToUse = eventDate || new Date().toISOString().split("T")[0];
    const startDateTime = `${dateToUse}T${startTime}:00`;
    const endDateTime = `${dateToUse}T${endTime}:00`;

    setPriceLoading(true);
    try {
      // Calculate with selected add-ons
      const response = await fetch("/api/pricing/pro-dj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: bookingType,
          packageId: selectedPackage.id,
          startTime: startDateTime,
          endTime: endDateTime,
          selectedAddons,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProDjPricing(data.calculation);
      } else {
        console.error("Failed to fetch Pro-DJ pricing");
        setProDjPricing(null);
      }
    } catch (error) {
      console.error("Error calculating Pro-DJ pricing:", error);
      setProDjPricing(null);
    } finally {
      setPriceLoading(false);
    }
  };

  // Load available packages when booking type changes
  useEffect(() => {
    loadAvailablePackages();
  }, [bookingType]);

  // Load Pro-DJ add-ons when booking type and time changes
  useEffect(() => {
    const loadProDjAddons = async () => {
      if (!bookingType || !startTime || !endTime) return;

      try {
        const response = await fetch(
          `/api/pricing/pro-dj?eventType=${bookingType}&startTime=${startTime}&endTime=${endTime}`
        );
        if (response.ok) {
          const data = await response.json();
          setProDjAddons(data.addons || []);
        }
      } catch (error) {
        console.error("Error loading Pro-DJ add-ons:", error);
      }
    };

    loadProDjAddons();
  }, [bookingType, startTime, endTime]);

  // Calculate pricing when form details, package, or add-ons change
  useEffect(() => {
    calculateProDjPricing();
  }, [bookingType, startTime, endTime, selectedPackage, selectedAddons]);

  // Auto-select included add-ons when package changes
  useEffect(() => {
    if (selectedPackage && selectedPackage.includedAddons) {
      setSelectedAddons(selectedPackage.includedAddons);
    }
  }, [selectedPackage]);

  // Auto-calculate end time when package or start time changes (only for package-based events)
  useEffect(() => {
    if (selectedPackage && startTime && selectedPackage.durationHours) {
      calculateEndTimeFromPackage(startTime, selectedPackage);
    }
  }, [selectedPackage, startTime]);

  // Load available DJs when event details change
  useEffect(() => {
    const loadDJs = async () => {
      if (!bookingType || !eventDate || !startTime || !endTime) {
        setDjs([]);
        return;
      }

      setIsLoadingDjs(true);
      try {
        const response = await fetch(
          `/api/djs?eventType=${bookingType}&date=${eventDate}&startTime=${startTime}&endTime=${endTime}`
        );

        if (response.ok) {
          const data = await response.json();
          setDjs(data.djs || []);
        }
      } catch (error) {
        console.error("Error loading DJs:", error);
      } finally {
        setIsLoadingDjs(false);
      }
    };

    loadDJs();
  }, [bookingType, eventDate, startTime, endTime]);

  // Initialize form data from URL parameters (for refund recovery)
  useEffect(() => {
    const fromRefund = params.get("fromRefund");
    if (fromRefund === "true") {
      setIsRecoveryMode(true);

      // Pre-fill form data from URL parameters
      const urlEventType = params.get("eventType");
      const urlEventDate = params.get("eventDate");
      const urlStartTime = params.get("startTime");
      const urlEndTime = params.get("endTime");
      const urlContactEmail = params.get("contactEmail");
      const urlPreferredGenres = params.get("preferredGenres");
      const urlMusicStyle = params.get("musicStyle");
      const urlClientEquipment = params.get("clientEquipment");
      const urlAge = params.get("age");
      const urlVenueName = params.get("venueName");
      const urlGuestCount = params.get("guestCount");
      const urlClubName = params.get("clubName");
      const urlCompanyName = params.get("companyName");
      const urlEventDetails = params.get("eventDetails");

      if (urlEventType) setBookingType(urlEventType as BookingType);
      if (urlEventDate) setEventDate(urlEventDate);
      if (urlStartTime) setStartTime(urlStartTime);
      if (urlEndTime) setEndTime(urlEndTime);
      if (urlContactEmail) setContactEmail(urlContactEmail);
      if (urlPreferredGenres)
        setPreferredGenres(urlPreferredGenres.split(",").filter(Boolean));
      if (urlMusicStyle) setMusicStyle(urlMusicStyle);
      if (urlClientEquipment) setClientEquipment(urlClientEquipment);
      if (urlAge) setExtra((prev) => ({ ...prev, age: urlAge }));
      if (urlVenueName)
        setExtra((prev) => ({ ...prev, venueName: urlVenueName }));
      if (urlGuestCount)
        setExtra((prev) => ({ ...prev, guestCount: urlGuestCount }));
      if (urlClubName) setExtra((prev) => ({ ...prev, clubName: urlClubName }));
      if (urlCompanyName)
        setExtra((prev) => ({ ...prev, companyName: urlCompanyName }));
      if (urlEventDetails) setMessage(urlEventDetails);
    }
  }, [params]);

  // Load all DJs
  useEffect(() => {
    const loadDjs = async () => {
      setIsLoadingDjs(true);
      try {
        const res = await fetch("/api/djs", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json.ok) {
          setDjs(json.djs);
        }
      } catch (error) {
        console.error("Error loading DJs:", error);
      } finally {
        setIsLoadingDjs(false);
      }
    };
    loadDjs();
  }, []);

  // Filter DJs based on search term and preferred genres
  const filteredDjs = djs.filter((dj) => {
    // Filter by search term
    if (djSearchTerm) {
      const searchMatch =
        dj.stageName.toLowerCase().includes(djSearchTerm.toLowerCase()) ||
        (dj.genres || []).some((genre) =>
          genre.toLowerCase().includes(djSearchTerm.toLowerCase())
        ) ||
        (dj.bio && dj.bio.toLowerCase().includes(djSearchTerm.toLowerCase())) ||
        (dj.specialties &&
          dj.specialties.toLowerCase().includes(djSearchTerm.toLowerCase())) ||
        (dj.location &&
          dj.location.toLowerCase().includes(djSearchTerm.toLowerCase()));

      if (!searchMatch) return false;
    }

    // Filter by preferred genres
    if (preferredGenres.length > 0) {
      const hasMatchingGenre = (dj.genres || []).some((djGenre) =>
        preferredGenres.some(
          (preferredGenre) =>
            djGenre.toLowerCase().includes(preferredGenre.toLowerCase()) ||
            preferredGenre.toLowerCase().includes(djGenre.toLowerCase())
        )
      );

      if (!hasMatchingGenre) return false;
    }

    return true;
  });

  // Get suggested DJs based on event type and preferences
  const getSuggestedDjs = () => {
    if (!bookingType) return [];

    return filteredDjs
      .filter((dj) => {
        // Smart filtering: prioritize DJs who offer this event type, but don't exclude others completely
        let score = 0;

        // Bonus for DJs who explicitly offer this event type
        if (dj.eventsOffered && dj.eventsOffered.length > 0) {
          if (dj.eventsOffered.includes(bookingType)) {
            score += 15; // Higher weight for event type match
          }
        } else {
          // DJs who haven't set eventsOffered get a neutral score
          score += 5;
        }

        // Bonus for DJs with good ratings (but lower weight)
        if (dj.rating && dj.rating >= 4.0) {
          score += 2;
        }

        // Only exclude DJs with very low scores (those who explicitly don't offer this event)
        return score > 0;
      })
      .sort((a, b) => {
        // Calculate scores for sorting
        const getScore = (dj: (typeof djs)[0]) => {
          let score = 0;

          // Primary: Event type match (highest weight)
          if (dj.eventsOffered && dj.eventsOffered.length > 0) {
            if (dj.eventsOffered.includes(bookingType)) {
              score += 15;
            }
          } else {
            score += 5;
          }

          // Secondary: Rating quality (moderate weight)
          if (dj.rating && dj.rating >= 4.0) score += 2;
          if (dj.rating) score += dj.rating * 0.5; // Lower weight for rating

          return score;
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);

        return scoreB - scoreA; // Higher scores first
      })
      .slice(0, 3); // Show top 3 suggestions
  };

  const suggestedDjs = getSuggestedDjs();

  // Fetch DJ add-ons
  const fetchDjAddons = async (djId: string) => {
    try {
      const response = await fetch(`/api/djs/${djId}/addons`);
      const data = await response.json();

      if (response.ok) {
        return data.addons;
      } else {
        console.error("Failed to fetch DJ add-ons:", data.error);
        return [];
      }
    } catch (error) {
      console.error("Error fetching DJ add-ons:", error);
      return [];
    }
  };

  // Time management utilities
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle overnight events (events that span midnight)
  const isOvernightEvent = (startTime: string, endTime: string): boolean => {
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    return endMinutes < startMinutes;
  };

  const getAdjustedEndTime = (startTime: string, endTime: string): number => {
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    // If end time is before start time, it's overnight (add 24 hours)
    if (endMinutes < startMinutes) {
      return endMinutes + 24 * 60; // Add 24 hours in minutes
    }
    return endMinutes;
  };

  const checkTimeOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    const s1 = parseTime(start1);
    const e1 = getAdjustedEndTime(start1, end1);
    const s2 = parseTime(start2);
    const e2 = getAdjustedEndTime(start2, end2);
    return s1 < e2 && s2 < e1;
  };

  const checkTimeGaps = (
    times: Array<{ startTime: string; endTime: string }>
  ): Array<{ start: string; end: string }> => {
    const sortedTimes = [...times].sort(
      (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
    );
    const gaps: Array<{ start: string; end: string }> = [];

    for (let i = 0; i < sortedTimes.length - 1; i++) {
      const currentEnd = getAdjustedEndTime(
        sortedTimes[i].startTime,
        sortedTimes[i].endTime
      );
      const nextStart = parseTime(sortedTimes[i + 1].startTime);

      if (nextStart > currentEnd) {
        gaps.push({
          start: formatTime(currentEnd % (24 * 60)), // Convert back to 24-hour format
          end: formatTime(nextStart),
        });
      }
    }

    return gaps;
  };

  const splitTimeEvenly = (
    startTime: string,
    endTime: string,
    djCount: number
  ): Array<{ startTime: string; endTime: string }> => {
    if (djCount <= 1) {
      return [{ startTime, endTime }];
    }

    const startMinutes = parseTime(startTime);
    const endMinutes = getAdjustedEndTime(startTime, endTime);
    const totalDuration = endMinutes - startMinutes;
    const segmentDuration = Math.floor(totalDuration / djCount);

    const segments: Array<{ startTime: string; endTime: string }> = [];

    for (let i = 0; i < djCount; i++) {
      const segmentStart = startMinutes + i * segmentDuration;
      const segmentEnd =
        i === djCount - 1
          ? endMinutes
          : startMinutes + (i + 1) * segmentDuration;

      segments.push({
        startTime: formatTime(segmentStart % (24 * 60)), // Convert back to 24-hour format
        endTime: formatTime(segmentEnd % (24 * 60)), // Convert back to 24-hour format
      });
    }

    return segments;
  };

  // Pro-DJ model: Single DJ preference selection (old marketplace addDj function removed)

  // Check for partial booking conditions
  const checkPartialBooking = () => {
    if (selectedDjs.length === 0) return null;

    const gaps = checkTimeGaps(
      selectedDjs.map((dj) => ({
        startTime: dj.startTime,
        endTime: dj.endTime,
      }))
    );

    const sortedDjs = [...selectedDjs].sort(
      (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
    );
    const eventStart = parseTime(startTime);
    const eventEnd = getAdjustedEndTime(startTime, endTime);

    let uncoveredStart: string | undefined;
    let uncoveredEnd: string | undefined;

    if (sortedDjs.length > 0) {
      const firstDjStart = parseTime(sortedDjs[0].startTime);
      const lastDjEnd = getAdjustedEndTime(
        sortedDjs[sortedDjs.length - 1].startTime,
        sortedDjs[sortedDjs.length - 1].endTime
      );

      if (firstDjStart > eventStart) {
        uncoveredStart = `${formatTime(eventStart)} to ${formatTime(
          firstDjStart
        )}`;
      }

      if (lastDjEnd < eventEnd) {
        uncoveredEnd = `${formatTime(lastDjEnd % (24 * 60))} to ${formatTime(
          eventEnd % (24 * 60)
        )}`;
      }
    }

    if (gaps.length > 0 || uncoveredStart || uncoveredEnd) {
      return { gaps, uncoveredStart, uncoveredEnd };
    }

    return null;
  };

  // Time validation and warnings (only for overlaps)
  const getTimeWarnings = () => {
    const warnings: string[] = [];

    if (selectedDjs.length === 0) return warnings;

    // Check for overlaps only
    for (let i = 0; i < selectedDjs.length; i++) {
      for (let j = i + 1; j < selectedDjs.length; j++) {
        const dj1 = selectedDjs[i];
        const dj2 = selectedDjs[j];

        if (
          checkTimeOverlap(
            dj1.startTime,
            dj1.endTime,
            dj2.startTime,
            dj2.endTime
          )
        ) {
          warnings.push(
            `⚠️ Time overlap detected between ${dj1.dj.stageName} and ${dj2.dj.stageName}`
          );
        }
      }
    }

    return warnings;
  };

  // Partial booking confirmation state
  const [showPartialBookingModal, setShowPartialBookingModal] = useState(false);
  const [partialBookingDetails, setPartialBookingDetails] = useState<{
    gaps: Array<{ start: string; end: string }>;
    uncoveredStart?: string;
    uncoveredEnd?: string;
  }>({ gaps: [] });

  // Add-ons collapsible state
  const [isAddonsExpanded, setIsAddonsExpanded] = useState(false);

  // Update DJ time slot
  // Pro-DJ model: Time adjustment handled at event level, not individual DJ level
  const updateDjTime = (
    djId: string,
    newStartTime: string,
    newEndTime: string
  ) => {
    // In Pro-DJ model, we update the main event times instead of individual DJ times
    setStartTime(newStartTime);
    setEndTime(newEndTime);
    // This will trigger pricing recalculation automatically
  };

  // Handle partial booking confirmation
  const confirmPartialBooking = async () => {
    setShowPartialBookingModal(false);
    setLoading(true);

    try {
      const bookingPromises = selectedDjs.map((djBooking) =>
        fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingType,
            eventDate,
            startTime: `${eventDate}T${djBooking.startTime}`,
            endTime: `${eventDate}T${djBooking.endTime}`,
            message,
            djId: djBooking.djId,
            extra: {
              contactEmail,
              clientEquipment,
              ...extra,
              selectedAddons: selectedAddons.join(",") || "",
            },
            preferredGenres,
            musicStyle,
          }),
        })
      );

      const responses = await Promise.all(bookingPromises);
      const results = await Promise.all(responses.map((res) => res.json()));

      const hasError = results.some((result) => !result.ok);
      if (hasError) {
        const errorResult = results.find((result) => !result.ok);
        setMsg(errorResult?.error || "Failed to create booking");
        setLoading(false);
        return;
      }

      toast.success("Partial booking request submitted successfully!");
      router.push("/dashboard/bookings");
    } catch (error) {
      console.error("Error submitting booking:", error);
      setMsg("Failed to submit booking request");
      setLoading(false);
    }
  };

  // Toggle Pro-DJ standardized add-on selection
  const toggleProDjAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  // Select preferred DJ (Pro-DJ model)
  const selectPreferredDj = (dj: { id: string; stageName: string }) => {
    // Check if this DJ is already selected
    if (preferredDj?.djId === dj.id) {
      // Deselect if clicking the same DJ
      setPreferredDj(null);
      return;
    }

    // Select the new DJ (replacing any previous selection)
    setPreferredDj({
      djId: dj.id,
      stageName: dj.stageName,
    });

    // Show confirmation toast
    toast.success(`${dj.stageName} selected as preferred DJ`);
  };

  // Calculate DJ total price (Pro-DJ model uses centralized pricing)
  const calculateDjTotalPrice = () => {
    // In Pro-DJ model, we use centralized pricing
    return proDjPricing ? proDjPricing.totalPriceCents : 0;
  };

  // Submit Pro-DJ booking request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    // Validate Pro-DJ pricing is calculated
    if (!proDjPricing) {
      setMsg("Please wait for pricing to load before submitting.");
      setLoading(false);
      return;
    }

    try {
      // For Pro-DJ model, we submit one booking request with optional DJ preference
      const preferredDjId = preferredDj ? preferredDj.djId : null;

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType,
          eventDate,
          startTime: `${eventDate}T${startTime}`,
          endTime: `${eventDate}T${endTime}`,
          message,
          djId: preferredDjId, // Optional preference - admin will make final assignment
          packageId: selectedPackage?.id, // Include the selected package ID
          extra: {
            contactEmail,
            clientEquipment,
            ...extra,
            selectedAddons: selectedAddons.join(","), // Pro-DJ standardized add-ons
          },
          preferredGenres,
          musicStyle,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setMsg(
          "🎉 Booking request submitted successfully! Our team will review and assign the perfect DJ for your event. Redirecting to your bookings..."
        );
        setTimeout(() => {
          router.push("/dashboard/bookings");
        }, 1500);
      } else {
        setMsg(
          `⚠️ Booking request failed: ${result.error || "Please try again"}`
        );
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      setMsg(
        "❌ Unable to submit booking request at this time. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-gray-300 mb-6">
              Booking is only available for client accounts.
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Book Pro-DJ Service</h1>
            <p className="text-xl text-gray-300">
              Professional DJ service with standardized pricing and expert team
              selection
            </p>
          </div>

          {/* Recovery Mode Banner */}
          {isRecoveryMode && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h3 className="text-orange-200 font-semibold">
                  Rebooking After Refund
                </h3>
              </div>
              <p className="text-orange-300 text-sm">
                Your previous booking was refunded. We&apos;ve pre-filled your
                event details below. Please select a new DJ for your event.
              </p>
            </div>
          )}

          {/* Main Form */}
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Type *
                </label>
                <select
                  value={bookingType}
                  onChange={(e) =>
                    setBookingType(e.target.value as BookingType)
                  }
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="">Select your event type</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Club">Club</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Private Party">Private Party</option>
                </select>
              </div>

              {/* Package Selection */}
              {bookingType && availablePackages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Package *
                  </label>
                  <div className="space-y-3">
                    {availablePackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPackage?.id === pkg.id
                            ? "border-violet-500 bg-violet-900/20"
                            : "border-gray-600 bg-gray-700 hover:border-gray-500"
                        }`}
                        onClick={() => handlePackageSelection(pkg)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="font-semibold text-white">
                                {pkg.packageName}
                              </div>
                              <span className="text-xs bg-violet-600 text-violet-100 px-2 py-1 rounded-full font-medium">
                                {pkg.packageType}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-3">
                              {pkg.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <span>⏱️</span>
                                <span>{pkg.durationHours} hours</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>🎵</span>
                                <span>
                                  {pkg.includedAddons.length} included services
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-violet-400">
                              ${(pkg.basePriceCents / 100).toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-400">
                              package price
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Event Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time *
                    {selectedPackage && selectedPackage.durationHours && (
                      <span className="text-xs text-violet-400 ml-2">
                        (Auto-calculated from {selectedPackage.durationHours}h
                        package)
                      </span>
                    )}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    disabled={
                      !!(selectedPackage && selectedPackage.durationHours)
                    }
                    className={`w-full border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                      selectedPackage && selectedPackage.durationHours
                        ? "bg-gray-600 border-gray-500 cursor-not-allowed"
                        : "bg-gray-700 border-gray-600"
                    }`}
                  />
                  {selectedPackage && selectedPackage.durationHours && (
                    <p className="text-xs text-gray-400 mt-1">
                      End time automatically set based on{" "}
                      {selectedPackage.packageName} duration
                    </p>
                  )}
                  {selectedPackage && !selectedPackage.durationHours && (
                    <p className="text-xs text-gray-400 mt-1">
                      Set your preferred end time for this hourly-based event
                    </p>
                  )}
                </div>
              </div>

              {/* Event Duration Display */}
              {totalEventDuration > 0 && (
                <div
                  className={`border rounded-lg p-4 ${
                    selectedPackage &&
                    selectedPackage.durationHours &&
                    totalEventDuration === selectedPackage.durationHours
                      ? "bg-green-900/20 border-green-500/30"
                      : "bg-blue-900/20 border-blue-500/30"
                  }`}
                >
                  <div
                    className={`text-sm ${
                      selectedPackage &&
                      selectedPackage.durationHours &&
                      totalEventDuration === selectedPackage.durationHours
                        ? "text-green-200"
                        : "text-blue-200"
                    }`}
                  >
                    Event Duration:{" "}
                    <span className="font-semibold">
                      {totalEventDuration} hours
                    </span>
                    {selectedPackage &&
                      selectedPackage.durationHours &&
                      totalEventDuration === selectedPackage.durationHours && (
                        <span className="text-green-300 ml-2">
                          ✓ Matches {selectedPackage.packageName} duration
                        </span>
                      )}
                    {selectedPackage &&
                      selectedPackage.durationHours &&
                      totalEventDuration !== selectedPackage.durationHours && (
                        <span className="text-yellow-300 ml-2">
                          ⚠️ Does not match package duration (
                          {selectedPackage.durationHours}h)
                        </span>
                      )}
                    {selectedPackage && !selectedPackage.durationHours && (
                      <span className="text-blue-300 ml-2">
                        Hourly-based event
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Extra Fields */}
              {typeConfig?.extraFields.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {field === "age"
                      ? "Age of Birthday Person"
                      : field === "venueName"
                      ? "Venue Name"
                      : field === "guestCount"
                      ? "Expected Guest Count"
                      : field === "companyName"
                      ? "Company Name"
                      : field === "eventPurpose"
                      ? "Event Purpose"
                      : field === "attendeeCount"
                      ? "Expected Attendee Count"
                      : field === "partyType"
                      ? "Party Type"
                      : field === "venueType"
                      ? "Venue Type"
                      : field === "partyTheme"
                      ? "Party Theme"
                      : field === "clubName"
                      ? "Club Name"
                      : field}
                  </label>
                  <input
                    type={
                      field === "age" || field === "guestCount"
                        ? "number"
                        : "text"
                    }
                    placeholder={
                      field === "age"
                        ? "e.g., 25"
                        : field === "venueName"
                        ? "e.g., Grand Hotel Ballroom"
                        : field === "guestCount"
                        ? "e.g., 150"
                        : field === "companyName"
                        ? "e.g., ABC Corporation"
                        : field === "eventPurpose"
                        ? "e.g., Annual Conference, Holiday Party"
                        : field === "attendeeCount"
                        ? "e.g., 200"
                        : field === "partyType"
                        ? "e.g., Anniversary, Graduation"
                        : field === "venueType"
                        ? "e.g., Hotel, Restaurant, Private Home"
                        : field === "partyTheme"
                        ? "e.g., 80s, Tropical, Superhero"
                        : field === "clubName"
                        ? "e.g., Club XYZ"
                        : field
                    }
                    value={extra[field] ?? ""}
                    onChange={(e) =>
                      setExtra({ ...extra, [field]: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              ))}

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  placeholder="your-email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Music Preferences */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                <h3 className="text-lg font-semibold text-violet-400 mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Music Preferences
                </h3>

                {/* Preferred Genres */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Preferred Music Genres
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {availableGenres.map((genre) => (
                      <label
                        key={genre}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={preferredGenres.includes(genre)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPreferredGenres([...preferredGenres, genre]);
                            } else {
                              setPreferredGenres(
                                preferredGenres.filter((g) => g !== genre)
                              );
                            }
                          }}
                          className="rounded border-gray-600 bg-gray-700 text-violet-500 focus:ring-violet-500"
                        />
                        <span className="text-sm text-gray-300">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Music Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Music Style & Energy Level
                  </label>
                  <select
                    value={musicStyle}
                    onChange={(e) => setMusicStyle(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="">Select music style...</option>
                    <option value="high-energy">
                      High Energy (Upbeat, Dance-focused)
                    </option>
                    <option value="moderate">
                      Moderate Energy (Mix of upbeat and chill)
                    </option>
                    <option value="chill">
                      Chill/Relaxed (Background music, ambient)
                    </option>
                    <option value="romantic">Romantic (Slow, intimate)</option>
                    <option value="professional">
                      Professional (Corporate, formal)
                    </option>
                    <option value="mixed">
                      Mixed (Variety throughout the event)
                    </option>
                  </select>
                </div>
              </div>

              {/* Equipment & Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Equipment & Amenities You&apos;ll Provide
                </label>
                <textarea
                  placeholder="Tell us what equipment/amenities you'll provide..."
                  value={clientEquipment}
                  onChange={(e) => setClientEquipment(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Event Details */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Details & Atmosphere *
                </label>
                <textarea
                  placeholder="Tell us about your event: venue details, special requirements, desired atmosphere, guest count, etc."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>

              {/* DJ Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select DJs for Your Event *
                </label>

                {/* Intelligent DJ Suggestions */}
                {bookingType && suggestedDjs.length > 0 && (
                  <div className="mb-6">
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-blue-400">💡</div>
                        <h4 className="text-blue-200 font-semibold">
                          Recommended DJs for {bookingType}
                        </h4>
                      </div>
                      <p className="text-blue-300 text-sm mb-4">
                        These DJs are perfect for your{" "}
                        {bookingType.toLowerCase()} event:
                      </p>
                      <div className="space-y-3">
                        {suggestedDjs.map((dj) => {
                          const isSelected = selectedDjs.some(
                            (sd) => sd.djId === dj.id
                          );
                          const totalPrice = calculateDjTotalPrice();
                          const offersEventType =
                            !bookingType ||
                            !dj.eventsOffered ||
                            dj.eventsOffered.includes(bookingType);

                          return (
                            <div
                              key={dj.id}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-900/20"
                                  : !offersEventType
                                  ? "border-red-500/50 bg-red-900/10 opacity-60"
                                  : "border-blue-600/50 bg-blue-900/10 hover:border-blue-400"
                              }`}
                              onClick={() => selectPreferredDj(dj)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="font-medium text-white">
                                      {dj.stageName}
                                    </div>
                                    {dj.isFeatured && (
                                      <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded-full font-medium">
                                        Featured
                                      </span>
                                    )}
                                    {dj.rating && dj.rating > 0 && (
                                      <span className="text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded-full font-medium">
                                        ⭐ {dj.rating.toFixed(1)}
                                      </span>
                                    )}
                                    {!offersEventType && bookingType && (
                                      <span className="text-xs bg-red-600 text-red-100 px-2 py-0.5 rounded-full font-medium">
                                        No {bookingType}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {(dj.genres || []).slice(0, 3).join(", ")}
                                    {(dj.genres || []).length > 3 && "..."}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Professional DJ Service
                                  </div>
                                  {!offersEventType && bookingType && (
                                    <div className="text-xs text-red-400 mt-1">
                                      Does not offer {bookingType} events
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isSelected ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-blue-400"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* DJ Search */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">Search DJs</label>
                    <span className="text-xs text-gray-400">
                      {filteredDjs.length} of {djs.length} DJs available
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search DJs by name, genre, location, or specialties..."
                    value={djSearchTerm}
                    onChange={(e) => setDjSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                {/* DJ List */}
                <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                  {isLoadingDjs ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-2"></div>
                      <p>Loading DJs...</p>
                    </div>
                  ) : filteredDjs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>No DJs found matching your search criteria</p>
                      <p className="text-sm mt-2">
                        Try adjusting your search terms or check the
                        recommendations above
                      </p>
                    </div>
                  ) : (
                    filteredDjs.map((dj) => {
                      const isSelected = preferredDj?.djId === dj.id;
                      const totalPrice = calculateDjTotalPrice();
                      const offersEventType =
                        !bookingType ||
                        !dj.eventsOffered ||
                        dj.eventsOffered.includes(bookingType);

                      return (
                        <div
                          key={dj.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-violet-500 bg-violet-900/20"
                              : !offersEventType
                              ? "border-red-500/50 bg-red-900/10 opacity-60"
                              : "border-gray-600 bg-gray-700 hover:border-gray-500"
                          }`}
                          onClick={() => selectPreferredDj(dj)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-medium text-white">
                                  {dj.stageName}
                                </div>
                                {!offersEventType && bookingType && (
                                  <span className="text-xs bg-red-600 text-red-100 px-2 py-0.5 rounded-full font-medium">
                                    No {bookingType}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">
                                {(dj.genres || []).slice(0, 3).join(", ")}
                                {(dj.genres || []).length > 3 && "..."}
                              </div>
                              <div className="text-xs text-gray-500">
                                Professional DJ Service
                              </div>
                              {!offersEventType && bookingType && (
                                <div className="text-xs text-red-400 mt-1">
                                  Does not offer {bookingType} events
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full border-2 border-violet-500 bg-violet-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* No DJs Available Message */}
                {bookingType && filteredDjs.length === 0 && (
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-6 text-center">
                    <div className="text-amber-400 text-2xl mb-2">🎵</div>
                    <h4 className="text-lg font-semibold text-amber-200 mb-2">
                      No DJs Available for {bookingType} Events
                    </h4>
                    <p className="text-amber-300 text-sm mb-4">
                      We don&apos;t have any DJs currently offering{" "}
                      {bookingType} events in your area.
                    </p>
                    <div className="text-amber-300 text-sm">
                      <p>Try:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• Selecting a different event type</li>
                        <li>• Expanding your search area</li>
                        <li>• Checking back later for new DJs</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Warnings */}
              {selectedDjs.length > 0 && (
                <div className="mb-6">
                  {getTimeWarnings().map((warning, index) => (
                    <div
                      key={index}
                      className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="text-red-400 text-lg">⚠️</div>
                        <div className="text-red-200 text-sm">{warning}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add-ons Selection */}
              {bookingType && startTime && endTime && (
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/30">
                  <button
                    type="button"
                    onClick={() => setIsAddonsExpanded(!isAddonsExpanded)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h3 className="text-lg font-semibold text-violet-400 flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add-ons
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {proDjAddons.length > 0
                          ? `${proDjAddons.length} professional add-ons available`
                          : "Loading add-ons..."}
                      </span>
                      <div
                        className={`transform transition-transform ${
                          isAddonsExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Add-ons Content */}
                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      isAddonsExpanded
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    {/* Pro-DJ add-on information */}
                    <div className="mb-4">
                      <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-violet-400">🎵</div>
                          <h4 className="text-violet-200 font-semibold">
                            Professional Pro-DJ Add-ons
                          </h4>
                        </div>
                        <p className="text-violet-300 text-sm">
                          Enhance your event with our standardized professional
                          add-ons. All add-ons include premium equipment and
                          expert setup by our Pro-DJ team.
                        </p>
                      </div>
                      {/* Old event-specific content for reference (commented out) */}
                      {false && bookingType === "Wedding" ? (
                        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-amber-400">✨</div>
                            <h4 className="text-amber-200 font-semibold">
                              Wedding & Private Event Add-ons
                            </h4>
                          </div>
                          <p className="text-amber-300 text-sm mb-3">
                            Most weddings & private events benefit from these
                            professional services:
                          </p>
                          <ul className="text-amber-300 text-sm space-y-1">
                            <li>
                              • <strong>Professional Lighting</strong> - Creates
                              romantic ambiance
                            </li>
                            <li>
                              • <strong>Premium Setup</strong> - High-quality
                              sound for ceremony & reception
                            </li>
                            <li>
                              • <strong>MC Services</strong> - Professional
                              coordination of your special day
                            </li>
                          </ul>
                        </div>
                      ) : bookingType === "Birthday" ? (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-blue-400">🎉</div>
                            <h4 className="text-blue-200 font-semibold">
                              Birthday Party Add-ons
                            </h4>
                          </div>
                          <p className="text-blue-300 text-sm">
                            Enhance your birthday celebration with professional
                            lighting, premium sound, and custom playlists.
                          </p>
                        </div>
                      ) : bookingType === "Club" ? (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-purple-400">🎵</div>
                            <h4 className="text-purple-200 font-semibold">
                              Club Event Add-ons
                            </h4>
                          </div>
                          <p className="text-purple-300 text-sm">
                            Professional lighting, premium sound systems, and
                            special effects for an unforgettable club
                            experience.
                          </p>
                        </div>
                      ) : bookingType === "Corporate" ? (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-green-400">🏢</div>
                            <h4 className="text-green-200 font-semibold">
                              Corporate Event Add-ons
                            </h4>
                          </div>
                          <p className="text-green-300 text-sm">
                            Professional setup, lighting, and MC services for
                            corporate events and presentations.
                          </p>
                        </div>
                      ) : bookingType === "Private Party" ? (
                        <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-pink-400">🎊</div>
                            <h4 className="text-pink-200 font-semibold">
                              Private Party Add-ons
                            </h4>
                          </div>
                          <p className="text-pink-300 text-sm">
                            Custom lighting, premium sound, and special services
                            to make your private party unforgettable.
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-6">
                      {proDjAddons.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p>Loading professional add-ons...</p>
                        </div>
                      ) : (
                        /* Group add-ons by category */
                        Object.entries(
                          proDjAddons.reduce((acc, addon) => {
                            if (!acc[addon.category]) acc[addon.category] = [];
                            acc[addon.category].push(addon);
                            return acc;
                          }, {} as Record<string, typeof proDjAddons>)
                        ).map(([category, addons]) => (
                          <div key={category} className="space-y-3">
                            {/* Category Header */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                              <h4 className="font-semibold text-violet-300">
                                {category}
                              </h4>
                            </div>

                            {/* Add-ons in this category */}
                            {addons.map((addon) => (
                              <label
                                key={addon.id}
                                className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${
                                  selectedAddons.includes(addon.id)
                                    ? "border-violet-500 bg-violet-900/20"
                                    : "border-gray-600 hover:border-violet-500"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedAddons.includes(addon.id)}
                                  onChange={() => toggleProDjAddon(addon.id)}
                                  className="mt-1 rounded border-gray-600 bg-gray-700 text-violet-500 focus:ring-violet-500"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <div className="font-medium text-white">
                                          {addon.name}
                                        </div>
                                        {addon.requiresSpecialEquipment && (
                                          <span className="text-xs bg-orange-600 text-orange-100 px-2 py-0.5 rounded-full font-medium">
                                            Special Equipment
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-gray-300 text-sm mt-1">
                                        {addon.description}
                                      </p>
                                    </div>
                                    <div className="text-right ml-3">
                                      <div className="font-semibold text-violet-400">
                                        ${(addon.totalPrice / 100).toFixed(2)}
                                      </div>
                                      {addon.pricePerHour && (
                                        <div className="text-xs text-gray-400">
                                          $
                                          {(addon.pricePerHour / 100).toFixed(
                                            2
                                          )}
                                          /hour
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Pro-DJ Pricing Summary */}
              {proDjPricing && (
                <>
                  <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-violet-300 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Pro-DJ Service Package
                    </h3>

                    {/* Package Details */}
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Event Type</div>
                          <div className="font-medium text-white">
                            {bookingType}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Package Duration</div>
                          <div className="font-medium text-white">
                            {proDjPricing.durationHours || 5} hours
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Package Type</div>
                          <div className="font-medium text-white">
                            {bookingType === "Wedding"
                              ? "Basic Package"
                              : "Standard Package"}
                          </div>
                        </div>
                      </div>

                      {/* Package Includes */}
                      <div className="mt-4 pt-4 border-t border-gray-600/30">
                        <div className="text-gray-400 text-sm mb-2">
                          Package Includes:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-gray-300">
                          {bookingType === "Wedding" ? (
                            <>
                              <div>• Ceremony, cocktail hour & reception</div>
                              <div>• Microphones for officiant & toasts</div>
                              <div>• Reception coordination as MC</div>
                              <div>• Planning consultation</div>
                              <div>• Professional sound system</div>
                              <div>• Basic lighting setup</div>
                            </>
                          ) : (
                            <>
                              <div>• Professional DJ service</div>
                              <div>• Premium sound system</div>
                              <div>• Microphones included</div>
                              <div>• Event coordination</div>
                              <div>• Music consultation</div>
                              <div>• Setup & breakdown</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pro-DJ Pricing Breakdown */}
                    <div className="space-y-4 mb-4">
                      {/* Pro-DJ Service Details */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        {/* Service Header */}
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-600/30">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                            <div className="font-semibold text-violet-300">
                              Pro-DJ Service
                              {preferredDj && (
                                <span className="text-sm text-gray-400 ml-2">
                                  (Preferred: {preferredDj.stageName})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">
                              Package Price
                            </div>
                            <div className="text-violet-400 font-semibold">
                              $
                              {(
                                (proDjPricing.totalPriceCents ||
                                  proDjPricing.basePriceCents ||
                                  0) / 100
                              ).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Package Price */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-sm text-gray-300">
                            {bookingType === "Wedding"
                              ? "Wedding Basic Package"
                              : `${bookingType} Standard Package`}
                            <div className="text-xs text-gray-400">
                              ({proDjPricing.durationHours || 5} hours coverage)
                            </div>
                          </div>
                          <div className="text-sm text-violet-400">
                            $
                            {((proDjPricing.basePriceCents || 0) / 100).toFixed(
                              2
                            )}
                          </div>
                        </div>

                        {/* Selected Pro-DJ Add-ons */}
                        {selectedAddons.length > 0 && (
                          <div className="space-y-2 mb-3">
                            <div className="text-sm text-gray-400 font-medium">
                              Selected Add-ons:
                            </div>
                            {proDjAddons
                              .filter((addon) =>
                                selectedAddons.includes(addon.id)
                              )
                              .map((addon) => (
                                <div
                                  key={addon.id}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-300">
                                      {addon.name}
                                    </span>
                                    <span className="text-xs bg-violet-600 text-violet-100 px-1.5 py-0.5 rounded-full">
                                      {addon.category}
                                    </span>
                                    {addon.requiresSpecialEquipment && (
                                      <span className="text-xs bg-orange-600 text-orange-100 px-1.5 py-0.5 rounded-full">
                                        Special Equipment
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-violet-400">
                                    ${(addon.totalPrice / 100).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Service Total */}
                        <div className="pt-3 border-t border-gray-600/30 flex justify-between items-center">
                          <span className="font-semibold text-white">
                            Pro-DJ Service Total:
                          </span>
                          <span className="text-violet-400 font-bold text-lg">
                            $
                            {(
                              (proDjPricing.totalPriceCents || 0) / 100
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="pt-4 border-t-2 border-violet-500/50">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span className="text-white">Total Amount:</span>
                        <span className="text-violet-400 text-2xl">
                          $
                          {((proDjPricing.totalPriceCents || 0) / 100).toFixed(
                            2
                          )}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1 text-center">
                        Professional Pro-DJ service with standardized pricing
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Status Message */}
              {msg && (
                <div
                  className={`p-4 rounded-lg text-center font-medium ${
                    msg.includes("successfully") || msg.includes("🎉")
                      ? "bg-green-900/50 text-green-200 border border-green-500/30"
                      : "bg-red-900/50 text-red-200 border border-red-500/30"
                  }`}
                >
                  {msg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || priceLoading || !proDjPricing}
                className={`w-full font-semibold py-4 px-6 rounded-lg transition-colors text-lg ${
                  loading || priceLoading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700"
                } disabled:cursor-not-allowed text-white`}
              >
                {loading
                  ? "Submitting..."
                  : priceLoading
                  ? "Loading Pricing..."
                  : "Submit Pro-DJ Booking Request"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Partial Booking Confirmation Modal */}
      {showPartialBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Partial DJ Coverage Detected
              </h3>
              <button
                onClick={() => setShowPartialBookingModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Your event has time periods without DJ coverage. Please confirm
                that you understand:
              </p>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <ul className="text-yellow-200 text-sm space-y-2">
                  {partialBookingDetails.gaps.length > 0 && (
                    <li>
                      • <strong>Time gaps:</strong>{" "}
                      {partialBookingDetails.gaps
                        .map((gap) => `${gap.start}-${gap.end}`)
                        .join(", ")}
                    </li>
                  )}
                  {partialBookingDetails.uncoveredStart && (
                    <li>
                      • <strong>No coverage at start:</strong>{" "}
                      {partialBookingDetails.uncoveredStart}
                    </li>
                  )}
                  {partialBookingDetails.uncoveredEnd && (
                    <li>
                      • <strong>No coverage at end:</strong>{" "}
                      {partialBookingDetails.uncoveredEnd}
                    </li>
                  )}
                  <li>
                    • <strong>DJs are not responsible</strong> for gaps or
                    uncovered periods
                  </li>
                  <li>
                    • <strong>You may need additional arrangements</strong> for
                    these time periods
                  </li>
                </ul>
              </div>

              <p className="text-gray-300 text-sm">
                Do you want to proceed with this partial DJ booking?
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPartialBookingModal(false)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel & Fix Times
              </button>
              <button
                onClick={confirmPartialBooking}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Confirm Partial Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
