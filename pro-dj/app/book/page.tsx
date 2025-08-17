"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { BOOKING_CONFIG, type BookingType } from "@/lib/booking-config";
import toast from "react-hot-toast";
import {
  Music,
  DollarSign,
  Check,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

export default function BookPage() {
  const { data } = useSession();
  const loggedIn = !!data?.user;
  const params = useSearchParams();

  const [types, setTypes] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const [bookingType, setBookingType] = useState<BookingType | "">("");
  const [packages, setPackages] = useState<
    Array<{ key: string; label: string; priceCents: number }>
  >([]);
  const [packageKey, setPackageKey] = useState("");
  const [selectedDjs, setSelectedDjs] = useState<
    Array<{
      djId: string;
      startTime: string;
      endTime: string;
      packageKey: string;
      dj: {
        id: string;
        stageName: string;
        genres: string[];
        basePriceCents: number;
      };
    }>
  >([]);
  const [djs, setDjs] = useState<
    Array<{
      id: string;
      stageName: string;
      genres: string[];
      basePriceCents: number;
    }>
  >([]);
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [contactEmail, setContactEmail] = useState("");
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [musicStyle, setMusicStyle] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [clientEquipment, setClientEquipment] = useState("");
  const [djSearchTerm, setDjSearchTerm] = useState("");
  const [showPartialBookingModal, setShowPartialBookingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedGenreFilter, setSelectedGenreFilter] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const typeConfig = bookingType ? BOOKING_CONFIG[bookingType] : null;

  // Auto-scroll to error message when it appears
  useEffect(() => {
    if (msg && !msg.includes("All Requests Sent") && !msg.includes("🎉")) {
      // Scroll to the error message container
      const errorMessage = document.getElementById("booking-status-message");
      if (errorMessage) {
        errorMessage.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [msg]);

  // Clear error message when user makes changes to fix the error
  const clearErrorOnChange = () => {
    if (msg && !msg.includes("All Requests Sent") && !msg.includes("🎉")) {
      setMsg("");
    }
  };

  // Helper function to compare times properly, handling overnight events
  const compareTimes = (time1: string, time2: string): number => {
    const [hours1, minutes1] = time1.split(":").map(Number);
    const [hours2, minutes2] = time2.split(":").map(Number);

    const totalMinutes1 = hours1 * 60 + minutes1;
    const totalMinutes2 = hours2 * 60 + minutes2;

    return totalMinutes1 - totalMinutes2;
  };

  // Helper function to check if a time is within a range, handling overnight events
  const isTimeInRange = (
    time: string,
    startTime: string,
    endTime: string
  ): boolean => {
    const timeMinutes = compareTimes(time, "00:00");
    const startMinutes = compareTimes(startTime, "00:00");
    const endMinutes = compareTimes(endTime, "00:00");

    // Handle overnight events (end time is before start time)
    if (endMinutes < startMinutes) {
      // Time is in range if it's after start OR before end
      return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
    } else {
      // Normal case: time is in range if it's between start and end
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    }
  };

  // Helper function to check if two time slots are adjacent (no gap)
  const areTimeSlotsAdjacent = (
    endTime1: string,
    startTime2: string
  ): boolean => {
    return compareTimes(startTime2, endTime1) === 0;
  };

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

  // Filter DJs based on search and filters
  const filteredDjs = djs.filter((dj) => {
    // Search by name
    const matchesSearch = dj.stageName
      .toLowerCase()
      .includes(djSearchTerm.toLowerCase());

    // Filter by genre
    const matchesGenre =
      !selectedGenreFilter || dj.genres.includes(selectedGenreFilter);

    // Filter by price range
    const matchesPrice =
      !priceRange ||
      (() => {
        const hourlyRate = dj.basePriceCents / 100;
        switch (priceRange) {
          case "budget":
            return hourlyRate <= 100;
          case "mid":
            return hourlyRate > 100 && hourlyRate <= 200;
          case "premium":
            return hourlyRate > 200;
          default:
            return true;
        }
      })();

    return matchesSearch && matchesGenre && matchesPrice;
  });

  // Function to calculate duration in hours
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Handle overnight events (end time before start time)
    if (duration < 0) {
      duration += 24;
    }

    return Math.round(duration * 100) / 100; // Round to 2 decimal places
  };

  // Calculate total event duration
  const totalEventDuration = calculateDuration(startTime, endTime);

  // Check if event duration might need multiple DJs
  const needsMultipleDjs = totalEventDuration > 8;

  // Check if this is a partial booking (DJs don't cover the entire event)
  const isPartialBooking = () => {
    if (selectedDjs.length === 0) return false;

    // Sort DJs by start time
    const sortedDjs = [...selectedDjs].sort((a, b) =>
      compareTimes(a.startTime, b.startTime)
    );

    const firstDj = sortedDjs[0];
    const lastDj = sortedDjs[sortedDjs.length - 1];

    // Check if there are gaps at start, end, or between DJs
    const startsAtEventStart = compareTimes(firstDj.startTime, startTime) === 0;
    const endsAtEventEnd = compareTimes(endTime, lastDj.endTime) === 0;

    // Check for gaps between consecutive DJs
    let hasGapsBetweenDjs = false;
    for (let i = 0; i < sortedDjs.length - 1; i++) {
      const currentDj = sortedDjs[i];
      const nextDj = sortedDjs[i + 1];
      const gapMinutes = compareTimes(nextDj.startTime, currentDj.endTime);
      if (gapMinutes > 0) {
        hasGapsBetweenDjs = true;
        break;
      }
    }

    return !startsAtEventStart || !endsAtEventEnd || hasGapsBetweenDjs;
  };

  // Get available time slots for new DJs
  const getAvailableTimeSlots = () => {
    if (!startTime || !endTime) return [];

    const usedSlots = selectedDjs.map((dj) => ({
      start: dj.startTime,
      end: dj.endTime,
    }));

    // Sort used slots by start time
    usedSlots.sort((a, b) => a.start.localeCompare(b.start));

    const availableSlots = [];
    let currentTime = startTime;

    for (const slot of usedSlots) {
      if (currentTime < slot.start) {
        availableSlots.push({
          start: currentTime,
          end: slot.start,
          duration: calculateDuration(currentTime, slot.start),
        });
      }
      currentTime = slot.end;
    }

    // Add remaining time after last slot
    if (currentTime < endTime) {
      availableSlots.push({
        start: currentTime,
        end: endTime,
        duration: calculateDuration(currentTime, endTime),
      });
    }

    return availableSlots;
  };

  // Get the next available time slot
  const getNextAvailableSlot = () => {
    const availableSlots = getAvailableTimeSlots();
    return availableSlots.length > 0 ? availableSlots[0] : null;
  };

  // Helper function to add a DJ with flexible time slot assignment
  const addDjWithTimeSlot = (dj: {
    id: string;
    stageName: string;
    genres: string[];
    basePriceCents: number;
  }) => {
    // If this is the first DJ, assign the full time slot
    if (selectedDjs.length === 0) {
      const newDj = {
        djId: dj.id,
        startTime: startTime,
        endTime: endTime,
        packageKey: autoSelectPackage(totalEventDuration),
        dj: dj,
      };
      setSelectedDjs([newDj]);
      return true;
    }

    // For additional DJs, evenly distribute the time
    const totalDjs = selectedDjs.length + 1;
    const timePerDj = totalEventDuration / totalDjs;

    // Calculate the new DJ's time slot
    const newDjIndex = selectedDjs.length;
    const newDjStartTime = new Date(`2000-01-01T${startTime}`);
    newDjStartTime.setMinutes(
      newDjStartTime.getMinutes() + timePerDj * 60 * newDjIndex
    );

    const newDjEndTime = new Date(newDjStartTime);
    newDjEndTime.setMinutes(newDjEndTime.getMinutes() + timePerDj * 60);

    // Update existing DJs to evenly distribute time
    const updatedDjs = selectedDjs.map((existingDj, index) => {
      const djStartTime = new Date(`2000-01-01T${startTime}`);
      djStartTime.setMinutes(djStartTime.getMinutes() + timePerDj * 60 * index);

      const djEndTime = new Date(djStartTime);
      djEndTime.setMinutes(djEndTime.getMinutes() + timePerDj * 60);

      return {
        ...existingDj,
        startTime: djStartTime.toTimeString().slice(0, 5),
        endTime: djEndTime.toTimeString().slice(0, 5),
        packageKey: autoSelectPackage(timePerDj),
      };
    });

    // Add the new DJ
    const newDj = {
      djId: dj.id,
      startTime: newDjStartTime.toTimeString().slice(0, 5),
      endTime: newDjEndTime.toTimeString().slice(0, 5),
      packageKey: autoSelectPackage(timePerDj),
      dj: dj,
    };

    setSelectedDjs([...updatedDjs, newDj]);
    return true;
  };

  // Function to auto-select package based on duration
  const autoSelectPackage = (duration: number): string => {
    if (duration <= 0) return "";

    // Find the best matching package based on duration
    const matchingPackage = packages.find((pkg) => {
      // Extract duration from package label (e.g., "2 Hour Package" -> 2)
      const durationMatch = pkg.label.match(/(\d+)\s*hour/i);
      if (durationMatch) {
        const packageDuration = parseInt(durationMatch[1]);
        return packageDuration >= duration;
      }
      return false;
    });

    return matchingPackage?.key || "";
  };

  // load types from db
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/pricing/types", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.ok) setTypes(json.data as string[]);
    })();
  }, []);

  // prefill bookingType from type
  useEffect(() => {
    const type = params.get("type");
    if (type) setBookingType(type as BookingType);

    // Check if this is recovery mode (replacing a DJ)
    const djId = params.get("djId");
    const isRecovery = params.get("recovery") === "true";
    if (djId && isRecovery) {
      setIsRecoveryMode(true);
      // Auto-select the suggested DJ
      const suggestedDj = djs.find((dj) => dj.id === djId);
      if (suggestedDj && !selectedDjs.some((sd) => sd.djId === djId)) {
        const nextSlot = getNextAvailableSlot();
        if (nextSlot) {
          const newDj = {
            djId: suggestedDj.id,
            startTime: nextSlot.start,
            endTime: nextSlot.end,
            packageKey: autoSelectPackage(nextSlot.duration),
            dj: suggestedDj,
          };
          setSelectedDjs([newDj]);
        }
      }
    }
  }, [params, djs, startTime, endTime, selectedDjs]);

  // load packages whenever booking type changes
  useEffect(() => {
    setPackages([]);
    setPackageKey("");

    if (!bookingType) return;
    (async () => {
      const res = await fetch(
        `/api/pricing?type=${encodeURIComponent(bookingType)}`,
        {
          cache: "no-store",
        }
      );
      const json = await res.json();
      if (res.ok) {
        // Handle both formats: direct array or { ok: true, data: [...] }
        const packagesData = Array.isArray(json)
          ? json
          : json.ok
          ? json.data
          : [];
        setPackages(packagesData);
      }
    })();
  }, [bookingType]);

  // State for DJ suggestions
  const [suggestedDjs, setSuggestedDjs] = useState<
    Array<{
      id: string;
      stageName: string;
      genres: string[];
      basePriceCents: number;
      score: number;
    }>
  >([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showAllDjs, setShowAllDjs] = useState(false);

  // Function to get DJ suggestions based on form data
  const getDjSuggestions = async () => {
    if (!eventDate || !startTime || !endTime) {
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const res = await fetch("/api/djs/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDate,
          startTime,
          endTime,
          eventType: bookingType,
          preferredGenres,
          musicStyle,
          eventVibe: "", // No longer collected separately - combined with message
          priceRange: "", // Let the algorithm handle pricing
          maxResults: 10,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setSuggestedDjs(json.data);
        setDjs(json.data); // Use suggestions as the main DJ list
      }
    } catch (error) {
      console.error("Error getting DJ suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Get DJ suggestions when form data changes
  useEffect(() => {
    if (eventDate && startTime && endTime && bookingType) {
      getDjSuggestions();
    }
  }, [eventDate, startTime, endTime, bookingType, preferredGenres, musicStyle]);

  // Load all DJs when user wants to see all
  const loadAllDjs = async () => {
    const res = await fetch("/api/djs", { cache: "no-store" });
    const json = await res.json();
    if (res.ok && json.ok) {
      setDjs(json.data);
      setShowAllDjs(true);
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (selectedDjs.length === 0) {
      setMsg(
        "🎧 Please select at least one DJ for your event. You can choose from our intelligent suggestions or browse all available DJs."
      );
      return;
    }

    // Check if this is a partial booking and show confirmation modal
    if (isPartialBooking()) {
      setShowPartialBookingModal(true);
      return;
    }

    // If not partial booking, proceed with submission
    await submitBookings();
  }

  async function submitBookings() {
    setLoading(true);
    setMsg("");

    // Validate that all DJs have packages selected
    const djsWithoutPackages = selectedDjs.filter((dj) => !dj.packageKey);
    if (djsWithoutPackages.length > 0) {
      setMsg(
        "📦 Please select a package for each DJ. Packages are automatically selected based on event duration, but you can change them if needed."
      );
      return;
    }

    // Validate that all time slots are within the event duration
    const invalidSlots = selectedDjs.filter((dj) => {
      // Check if DJ start time is within event range
      const djStartInRange = isTimeInRange(dj.startTime, startTime, endTime);
      // Check if DJ end time is within event range
      const djEndInRange = isTimeInRange(dj.endTime, startTime, endTime);

      return !djStartInRange || !djEndInRange;
    });

    if (invalidSlots.length > 0) {
      const dj = invalidSlots[0];
      const djStartInRange = isTimeInRange(dj.startTime, startTime, endTime);
      const djEndInRange = isTimeInRange(dj.endTime, startTime, endTime);

      let errorDetail = "";
      if (!djStartInRange && !djEndInRange) {
        errorDetail =
          "both start and end times are outside your event duration";
      } else if (!djStartInRange) {
        errorDetail = "start time is outside your event duration";
      } else {
        errorDetail = "end time is outside your event duration";
      }

      setMsg(
        `⏰ ${dj.dj.stageName} has a time slot issue: ${errorDetail}. Please adjust the times to stay within your event time (${startTime} - ${endTime}).`
      );
      return;
    }

    // Check for overlapping time slots between selected DJs
    for (let i = 0; i < selectedDjs.length; i++) {
      for (let j = i + 1; j < selectedDjs.length; j++) {
        const dj1 = selectedDjs[i];
        const dj2 = selectedDjs[j];

        // Helper function to check if two time ranges overlap
        const doTimeRangesOverlap = (
          start1: string,
          end1: string,
          start2: string,
          end2: string
        ): boolean => {
          const start1Minutes = compareTimes(start1, "00:00");
          const end1Minutes = compareTimes(end1, "00:00");
          const start2Minutes = compareTimes(start2, "00:00");
          const end2Minutes = compareTimes(end2, "00:00");

          // Handle overnight events for both ranges
          const adjustedEnd1 =
            end1Minutes < start1Minutes ? end1Minutes + 24 * 60 : end1Minutes;
          const adjustedEnd2 =
            end2Minutes < start2Minutes ? end2Minutes + 24 * 60 : end2Minutes;

          // Check for overlap
          return start1Minutes < adjustedEnd2 && start2Minutes < adjustedEnd1;
        };

        if (
          doTimeRangesOverlap(
            dj1.startTime,
            dj1.endTime,
            dj2.startTime,
            dj2.endTime
          )
        ) {
          setMsg(
            `⏰ Time slot conflict! ${dj1.dj.stageName} (${dj1.startTime}-${dj1.endTime}) and ${dj2.dj.stageName} (${dj2.startTime}-${dj2.endTime}) have overlapping times. Please adjust the times to avoid conflicts, or use the "Redistribute Time" button to evenly split your event.`
          );
          return;
        }
      }
    }

    // Check for minimum and maximum duration for each DJ
    const djsWithInvalidDuration = selectedDjs.filter((dj) => {
      const duration = calculateDuration(dj.startTime, dj.endTime);
      return duration < 1 || duration > 8;
    });

    if (djsWithInvalidDuration.length > 0) {
      const dj = djsWithInvalidDuration[0];
      const duration = calculateDuration(dj.startTime, dj.endTime);

      if (duration < 1) {
        setMsg(
          `⏰ ${dj.dj.stageName} has a time slot shorter than 1 hour (${duration} hours). Each DJ must have at least 1 hour. Please adjust the time slot.`
        );
      } else {
        setMsg(
          `⏰ ${dj.dj.stageName} has a time slot longer than 8 hours (${duration} hours). Each DJ cannot exceed 8 hours. Please adjust the time slot or add another DJ.`
        );
      }
      return;
    }

    // Check for gaps in time coverage
    if (selectedDjs.length === 1) {
      // Single DJ doesn't need to cover entire event - allow partial coverage
      const dj = selectedDjs[0];
      // Only validate that the DJ time slot is within the event duration (already done above)
      // No need to force complete coverage
    } else if (selectedDjs.length > 1) {
      // Sort DJs by start time
      const sortedDjs = [...selectedDjs].sort((a, b) =>
        compareTimes(a.startTime, b.startTime)
      );

      // Check for gaps between consecutive DJs (allow gaps for flexibility)
      for (let i = 0; i < sortedDjs.length - 1; i++) {
        const currentDj = sortedDjs[i];
        const nextDj = sortedDjs[i + 1];

        // Check if there's a gap between current DJ's end time and next DJ's start time
        const gapMinutes = compareTimes(nextDj.startTime, currentDj.endTime);

        if (gapMinutes > 0) {
          // Allow gaps but warn the user
          // Don't block submission - just allow for awareness
        }
      }

      // Note: We allow gaps at the beginning and end for flexibility
      // Users can have other entertainment or activities outside of our DJ bookings
      const firstDj = sortedDjs[0];
      const lastDj = sortedDjs[sortedDjs.length - 1];

      // Note: Gaps are allowed for flexibility but logged for awareness
      if (compareTimes(firstDj.startTime, startTime) > 0) {
        // Gap at event start - allowed
      }

      if (compareTimes(endTime, lastDj.endTime) > 0) {
        // Gap at event end - allowed
      }
    }

    // Create multiple bookings - one for each DJ
    const bookingPromises = selectedDjs.map((djBooking) =>
      fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType,
          packageKey: djBooking.packageKey, // Use individual DJ package
          eventDate,
          startTime: `${eventDate}T${djBooking.startTime}`,
          endTime: `${eventDate}T${djBooking.endTime}`,
          message,
          djId: djBooking.djId,
          extra: { contactEmail, clientEquipment },
          preferredGenres,
          musicStyle,
          eventVibe: "", // No longer collected separately - combined with message
        }),
      })
    );

    try {
      const responses = await Promise.all(bookingPromises);
      const results = await Promise.all(responses.map((res) => res.json()));

      const successCount = results.filter((result) => result.ok).length;
      const failureCount = results.length - successCount;

      if (failureCount === 0) {
        setMsg(
          "🎉 All booking requests sent successfully! Redirecting to your bookings..."
        );

        // Reset form
        setSelectedDjs([]);
        setMessage("");
        setContactEmail("");
        setClientEquipment("");
        setPreferredGenres([]);
        setMusicStyle("");
        setDjSearchTerm("");
        setSelectedGenreFilter("");
        setPriceRange("");
        setSuggestedDjs([]);
        setIsLoadingSuggestions(false);
        setShowAllDjs(false);

        // Redirect to bookings page after a short delay
        setTimeout(() => {
          window.location.href = "/dashboard/bookings";
        }, 2000);
      } else {
        // Show specific error messages for failed bookings
        const failedBookings = results.filter((result) => !result.ok);
        const errorMessages = failedBookings.map((result, index) => {
          const dj = selectedDjs[index];
          const djName = dj.dj.stageName;

          if (result.error) {
            return `${djName}: ${result.error}`;
          }
          return `${djName}: Booking request failed`;
        });

        setMsg(
          `⚠️ Some booking requests failed:\n${errorMessages.join(
            "\n"
          )}\n\nPlease check the details and try again.`
        );
      }
    } catch (error) {
      console.error("Error submitting bookings:", error);
      setMsg(
        "❌ Unable to submit booking requests at this time. Please check your internet connection and try again."
      );
    }
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-gray-300 mb-6">
              Booking is only available for client accounts. DJs and admins
              cannot create booking requests.
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
            <h1 className="text-4xl font-bold mb-2">Book Your Event</h1>
            <p className="text-xl text-gray-300">
              Let&apos;s create something amazing together
            </p>
          </div>

          {/* Recovery Mode Banner */}
          {isRecoveryMode && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-blue-400" />
                <h3 className="text-blue-200 font-semibold">
                  DJ Replacement Mode
                </h3>
              </div>
              <p className="text-blue-300 text-sm">
                You are replacing a DJ for your event. Only one DJ can be booked
                for this time slot. If you want to add more DJs, they must have
                different time slots.
              </p>
            </div>
          )}

          {/* Main Form */}
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto">
            <form onSubmit={submit} className="space-y-6">
              {/* Event Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Type *
                </label>
                <select
                  value={bookingType}
                  onChange={(e) => {
                    setBookingType(e.target.value as BookingType);
                    clearErrorOnChange();
                  }}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="">Select your event type</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => {
                    setEventDate(e.target.value);
                    clearErrorOnChange();
                  }}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Event Overview Time (for reference) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Start Time (Reference)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      clearErrorOnChange();
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="When your event starts"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event End Time (Reference)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      clearErrorOnChange();
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="When your event ends"
                  />
                </div>
              </div>

              {/* Extra Fields */}
              {typeConfig?.extraFields.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {field}
                  </label>
                  <input
                    type="text"
                    placeholder={field}
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
                            clearErrorOnChange();
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
                  <p className="text-xs text-gray-400 mt-2">
                    Select the genres you&apos;d like to hear at your event
                  </p>
                </div>

                {/* Music Style */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Music Style & Energy Level
                  </label>
                  <select
                    value={musicStyle}
                    onChange={(e) => {
                      setMusicStyle(e.target.value);
                      clearErrorOnChange();
                    }}
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
                  placeholder="Tell us what equipment/amenities you'll provide: e.g., 'We have our own speakers and DJ controller', 'Venue provides sound system', 'DJ needs to bring everything', 'We have lighting but need sound system', 'Venue has basic setup but needs professional equipment', etc."
                  value={clientEquipment}
                  onChange={(e) => {
                    setClientEquipment(e.target.value);
                    clearErrorOnChange();
                  }}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  This helps DJs know what equipment to bring. Common setups:
                  Clubs (own equipment), Weddings (venue provides some),
                  Birthdays (DJ brings everything), Corporate (varies by venue).
                </p>
              </div>

              {/* Event Details & Atmosphere */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Details & Atmosphere *
                </label>
                <textarea
                  placeholder="Tell us about your event: venue details, special requirements, desired atmosphere (e.g., 'Elegant and sophisticated', 'Fun and energetic', 'Intimate and romantic', 'Professional and formal'), guest count, any specific songs or moments you want to highlight, etc."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    clearErrorOnChange();
                  }}
                  required
                  rows={5}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Include venue details, atmosphere preferences, special
                  moments, guest count, and any other important information
                  about your event.
                </p>
              </div>

              {/* Available Time Slots Display */}
              {startTime && endTime && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-green-300 mb-3">
                    Event Time Management
                  </h4>
                  <div className="text-sm text-green-200 mb-2">
                    Total Event Duration: {totalEventDuration} hours (
                    {startTime} - {endTime})
                    {needsMultipleDjs && (
                      <div className="text-yellow-300 text-xs mt-1">
                        💡 Event over 8 hours - consider multiple DJs for better
                        coverage
                      </div>
                    )}
                    <div className="text-blue-300 text-xs mt-2">
                      💡 You can book DJs for part of your event - other
                      entertainment can cover the rest
                    </div>
                    {isPartialBooking() && (
                      <div className="text-orange-300 text-xs mt-2 p-2 bg-orange-900/20 rounded border border-orange-500/30">
                        ⚠️ <strong>Partial Event Coverage Detected:</strong>
                        <ul className="mt-1 space-y-1">
                          <li>
                            • DJs will only cover the specified time slots
                          </li>
                          <li>
                            • Intermissions between DJs are the client&apos;s
                            responsibility
                          </li>
                          <li>
                            • DJs are not obligated to cover gaps or
                            intermissions
                          </li>
                          <li>
                            • Please ensure you have alternative entertainment
                            for uncovered times
                          </li>
                        </ul>
                      </div>
                    )}
                    {selectedDjs.length > 1 && isPartialBooking() && (
                      <div className="text-yellow-300 text-xs mt-2 p-2 bg-yellow-900/20 rounded border border-yellow-500/30">
                        🎵 <strong>Multi-DJ Event with Gaps:</strong>
                        <ul className="mt-1 space-y-1">
                          <li>
                            • Each DJ will set up and tear down their own
                            equipment
                          </li>
                          <li>• Plan for setup/teardown time between DJs</li>
                          <li>
                            • Consider having background music during
                            transitions
                          </li>
                          <li>
                            • Communicate transition times with your venue
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-green-200 mb-2">
                    Selected DJs: {selectedDjs.length}
                    {selectedDjs.length > 1 && (
                      <span className="text-green-300 ml-2">
                        • {totalEventDuration / selectedDjs.length} hours each
                      </span>
                    )}
                  </div>
                  {selectedDjs.length > 1 && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          clearErrorOnChange();
                          // Redistribute time evenly among all DJs
                          const timePerDj =
                            totalEventDuration / selectedDjs.length;
                          const updatedDjs = selectedDjs.map((dj, index) => {
                            const djStartTime = new Date(
                              `2000-01-01T${startTime}`
                            );
                            djStartTime.setMinutes(
                              djStartTime.getMinutes() + timePerDj * 60 * index
                            );

                            const djEndTime = new Date(djStartTime);
                            djEndTime.setMinutes(
                              djEndTime.getMinutes() + timePerDj * 60
                            );

                            return {
                              ...dj,
                              startTime: djStartTime.toTimeString().slice(0, 5),
                              endTime: djEndTime.toTimeString().slice(0, 5),
                              packageKey: autoSelectPackage(timePerDj),
                            };
                          });
                          setSelectedDjs(updatedDjs);
                        }}
                        className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                      >
                        🔄 Redistribute Time Evenly
                      </button>
                    </div>
                  )}
                  {selectedDjs.length > 0 && (
                    <div className="text-sm text-green-200 mt-2">
                      <div className="text-xs text-green-300">
                        💡 Tip: You can manually adjust individual DJ times
                        below, or use &quot;Redistribute Time&quot; to evenly
                        split the event duration.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DJ Selection - Moved to end for intelligent suggestions */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select DJs for Your Event *
                </label>

                {/* DJ Selection Interface */}
                <div className="space-y-4">
                  {/* Intelligent Suggestions Banner */}
                  {eventDate && startTime && endTime && bookingType && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="w-5 h-5 text-blue-400" />
                        <h4 className="text-blue-200 font-semibold">
                          Intelligent DJ Suggestions
                        </h4>
                      </div>
                      <p className="text-blue-300 text-sm mb-3">
                        Based on your event details, music preferences, and
                        availability, here are our top recommendations:
                      </p>

                      {isLoadingSuggestions ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
                          <p className="text-blue-300 text-sm mt-2">
                            Finding perfect DJs for your event...
                          </p>
                        </div>
                      ) : suggestedDjs.length > 0 ? (
                        <div className="space-y-2">
                          {suggestedDjs.slice(0, 5).map((dj) => {
                            const isSelected = selectedDjs.some(
                              (sd) => sd.djId === dj.id
                            );
                            return (
                              <div
                                key={dj.id}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-violet-500 bg-violet-900/20"
                                    : "border-blue-600 bg-blue-900/20 hover:border-blue-500"
                                }`}
                                onClick={() => {
                                  clearErrorOnChange();
                                  if (isSelected) {
                                    setSelectedDjs(
                                      selectedDjs.filter(
                                        (sd) => sd.djId !== dj.id
                                      )
                                    );
                                  } else {
                                    // In recovery mode, only allow one DJ
                                    if (
                                      isRecoveryMode &&
                                      selectedDjs.length >= 1
                                    ) {
                                      setMsg(
                                        "In recovery mode, you can only select one DJ to replace the original DJ."
                                      );
                                      return;
                                    }

                                    addDjWithTimeSlot(dj);
                                  }
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-white">
                                      {dj.stageName}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      {dj.genres.slice(0, 3).join(", ")}
                                      {dj.genres.length > 3 && "..."}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ${(dj.basePriceCents / 100).toFixed(2)}/hr
                                    </div>
                                  </div>
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 ${
                                      isSelected
                                        ? "border-violet-500 bg-violet-500"
                                        : "border-blue-400"
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-blue-300">
                          <p>No DJs available for your selected time slot.</p>
                          <p className="text-sm">
                            Try adjusting your event time or date.
                          </p>
                        </div>
                      )}

                      {/* Browse All DJs Button */}
                      <div className="mt-4 pt-4 border-t border-blue-500/30">
                        <button
                          type="button"
                          onClick={() => {
                            if (showAllDjs) {
                              setShowAllDjs(false);
                              // Reset to suggestions when hiding
                              setDjs(suggestedDjs);
                            } else {
                              loadAllDjs();
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          {showAllDjs ? "Hide" : "Browse"} All Available DJs
                        </button>
                      </div>
                    </div>
                  )}

                  {/* All DJs Section (when showAllDjs is true) */}
                  {showAllDjs && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        All Available DJs
                      </h4>

                      {/* Search Bar */}
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search DJs by name..."
                          value={djSearchTerm}
                          onChange={(e) => setDjSearchTerm(e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Filter by Genre
                          </label>
                          <select
                            value={selectedGenreFilter}
                            onChange={(e) =>
                              setSelectedGenreFilter(e.target.value)
                            }
                            className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          >
                            <option value="">All Genres</option>
                            {availableGenres.map((genre) => (
                              <option key={genre} value={genre}>
                                {genre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Price Range
                          </label>
                          <select
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                            className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          >
                            <option value="">All Prices</option>
                            <option value="budget">Budget ($0-100/hr)</option>
                            <option value="mid">Mid-Range ($100-200/hr)</option>
                            <option value="premium">Premium ($200+/hr)</option>
                          </select>
                        </div>
                      </div>

                      {/* Results Count */}
                      <div className="text-xs text-gray-400 mb-3">
                        Showing {filteredDjs.length} of {djs.length} DJs
                      </div>

                      {/* DJ List */}
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredDjs.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <p>No DJs found matching your criteria</p>
                            <button
                              onClick={() => {
                                setDjSearchTerm("");
                                setSelectedGenreFilter("");
                                setPriceRange("");
                              }}
                              className="text-violet-400 hover:text-violet-300 text-sm mt-2"
                            >
                              Clear filters
                            </button>
                          </div>
                        ) : (
                          filteredDjs.map((dj) => {
                            const isSelected = selectedDjs.some(
                              (sd) => sd.djId === dj.id
                            );
                            return (
                              <div
                                key={dj.id}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-violet-500 bg-violet-900/20"
                                    : "border-gray-600 bg-gray-700 hover:border-gray-500"
                                }`}
                                onClick={() => {
                                  clearErrorOnChange();
                                  if (isSelected) {
                                    setSelectedDjs(
                                      selectedDjs.filter(
                                        (sd) => sd.djId !== dj.id
                                      )
                                    );
                                  } else {
                                    // In recovery mode, only allow one DJ
                                    if (
                                      isRecoveryMode &&
                                      selectedDjs.length >= 1
                                    ) {
                                      setMsg(
                                        "In recovery mode, you can only select one DJ to replace the original DJ."
                                      );
                                      return;
                                    }

                                    addDjWithTimeSlot(dj);
                                  }
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-white">
                                      {dj.stageName}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      {dj.genres.slice(0, 3).join(", ")}
                                      {dj.genres.length > 3 && "..."}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ${(dj.basePriceCents / 100).toFixed(2)}/hr
                                    </div>
                                  </div>
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 ${
                                      isSelected
                                        ? "border-violet-500 bg-violet-500"
                                        : "border-gray-400"
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected DJs with Time Slots */}
                  {selectedDjs.length > 0 && (
                    <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-violet-300 mb-3">
                        Selected DJs & Time Slots
                      </h4>
                      <div className="space-y-3">
                        {selectedDjs.map((selectedDj, index) => (
                          <div
                            key={selectedDj.djId}
                            className="bg-gray-800 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-medium text-white">
                                  {selectedDj.dj.stageName}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {selectedDj.dj.genres.join(", ")}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    clearErrorOnChange();
                                    // Calculate optimal time slot for this DJ
                                    const timePerDj =
                                      totalEventDuration / selectedDjs.length;
                                    const djStartTime = new Date(
                                      `2000-01-01T${startTime}`
                                    );
                                    djStartTime.setMinutes(
                                      djStartTime.getMinutes() +
                                        timePerDj * 60 * index
                                    );

                                    const djEndTime = new Date(djStartTime);
                                    djEndTime.setMinutes(
                                      djEndTime.getMinutes() + timePerDj * 60
                                    );

                                    const updated = [...selectedDjs];
                                    updated[index].startTime = djStartTime
                                      .toTimeString()
                                      .slice(0, 5);
                                    updated[index].endTime = djEndTime
                                      .toTimeString()
                                      .slice(0, 5);
                                    updated[index].packageKey =
                                      autoSelectPackage(timePerDj);
                                    setSelectedDjs(updated);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 text-xs"
                                  title="Assign optimal time slot based on DJ position"
                                >
                                  Auto Time
                                </button>
                                <button
                                  onClick={() =>
                                    setSelectedDjs(
                                      selectedDjs.filter((_, i) => i !== index)
                                    )
                                  }
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={selectedDj.startTime}
                                  min={startTime}
                                  max={endTime}
                                  onChange={(e) => {
                                    clearErrorOnChange();
                                    const updated = [...selectedDjs];
                                    updated[index].startTime = e.target.value;

                                    // Auto-select package based on duration
                                    if (updated[index].endTime) {
                                      const duration = calculateDuration(
                                        e.target.value,
                                        updated[index].endTime
                                      );
                                      updated[index].packageKey =
                                        autoSelectPackage(duration);
                                    }

                                    setSelectedDjs(updated);
                                  }}
                                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={selectedDj.endTime}
                                  min={startTime}
                                  max={endTime}
                                  onChange={(e) => {
                                    clearErrorOnChange();
                                    const updated = [...selectedDjs];
                                    updated[index].endTime = e.target.value;

                                    // Auto-select package based on duration
                                    if (updated[index].startTime) {
                                      const duration = calculateDuration(
                                        updated[index].startTime,
                                        e.target.value
                                      );
                                      updated[index].packageKey =
                                        autoSelectPackage(duration);
                                    }

                                    setSelectedDjs(updated);
                                  }}
                                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                              </div>
                            </div>

                            {/* Duration Display */}
                            {selectedDj.startTime && selectedDj.endTime && (
                              <div className="text-xs text-gray-400 mb-2">
                                Duration:{" "}
                                {calculateDuration(
                                  selectedDj.startTime,
                                  selectedDj.endTime
                                )}{" "}
                                hours
                              </div>
                            )}

                            {/* Package Selection for this DJ */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Package *
                              </label>
                              <select
                                value={selectedDj.packageKey}
                                onChange={(e) => {
                                  clearErrorOnChange();
                                  const updated = [...selectedDjs];
                                  updated[index].packageKey = e.target.value;
                                  setSelectedDjs(updated);
                                }}
                                className={`w-full bg-gray-700 border rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                                  selectedDj.packageKey
                                    ? "border-green-500"
                                    : "border-gray-600"
                                }`}
                                required
                              >
                                <option value="">Select a package</option>
                                {packages.length === 0 && (
                                  <option value="" disabled>
                                    Loading packages...
                                  </option>
                                )}
                                {packages.map((pkg) => {
                                  const currentDuration = calculateDuration(
                                    selectedDj.startTime,
                                    selectedDj.endTime
                                  );
                                  const hourlyRate = pkg.priceCents / 100;
                                  const totalPrice =
                                    currentDuration > 0
                                      ? (hourlyRate * currentDuration).toFixed(
                                          2
                                        )
                                      : hourlyRate.toFixed(2);

                                  return (
                                    <option key={pkg.key} value={pkg.key}>
                                      {pkg.label} - ${hourlyRate}/hr
                                      {currentDuration > 0
                                        ? ` ($${totalPrice} total for ${currentDuration}h)`
                                        : ""}
                                    </option>
                                  );
                                })}
                              </select>
                              {selectedDj.packageKey && (
                                <div className="text-xs text-green-400 mt-1">
                                  <Check className="w-4 h-4 inline mr-1" />
                                  Package selected - price calculated per hour
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Select one or more DJs and set their individual time slots.
                  Packages will be auto-selected based on duration. Each DJ will
                  receive a separate booking request.
                </p>
                <div className="text-xs text-blue-400 mt-2 p-2 bg-blue-900/20 rounded border border-blue-500/30">
                  <p className="font-medium mb-1">📋 Time Slot Requirements:</p>
                  <ul className="space-y-1">
                    <li>• DJ time slots must be within your event duration</li>
                    <li>• No overlaps between DJ time slots</li>
                    <li>• Partial event coverage is allowed</li>
                    <li>• Maximum 8 hours per DJ set</li>
                    <li>
                      • Use &quot;Auto Time&quot; or &quot;Redistribute
                      Time&quot; for help
                    </li>
                  </ul>
                </div>
              </div>

              {/* Status Message - Positioned right above submit button for visibility */}
              {msg && (
                <div
                  id="booking-status-message"
                  className={`p-4 rounded-lg text-center font-medium ${
                    msg.includes("All Requests Sent") || msg.includes("🎉")
                      ? "bg-green-900/50 text-green-200 border border-green-500/30"
                      : "bg-red-900/50 text-red-200 border border-red-500/30 animate-pulse"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {!msg.includes("All Requests Sent") &&
                      !msg.includes("🎉") && (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    {msg}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
              >
                Submit Booking Request
              </button>
            </form>
          </div>

          {/* Info Section */}
          <div className="mt-8 text-center">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-3 text-violet-400">
                What happens next?
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                <div>
                  <div className="text-2xl mb-2">📝</div>
                  <p>
                    We&apos;ll review your request and get back to you within 24
                    hours
                  </p>
                </div>
                <div>
                  <DollarSign className="w-6 h-6 mb-2" />
                  <p>
                    You&apos;ll receive a custom quote based on your event
                    details
                  </p>
                </div>
                <div>
                  <Check className="w-6 h-6 mb-2" />
                  <p>Once confirmed, secure your booking with a payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partial Booking Confirmation Modal */}
        {showPartialBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-orange-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-orange-200">
                  Partial Event Coverage Detected
                </h3>
              </div>

              <div className="text-gray-300 mb-6 space-y-3">
                <p className="text-sm">
                  Your booking has gaps or doesn&apos;t cover the entire event
                  duration. Please confirm you understand:
                </p>

                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      <span>
                        DJs will only cover their specified time slots
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      <span>
                        Intermissions between DJs are your responsibility
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      <span>
                        DJs are not obligated to cover gaps or intermissions
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      <span>
                        You must provide alternative entertainment for uncovered
                        times
                      </span>
                    </li>
                  </ul>
                </div>

                {selectedDjs.length > 1 && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-200 mb-2">
                      Multi-DJ Event Considerations:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">•</span>
                        <span>
                          Each DJ will set up and tear down their own equipment
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">•</span>
                        <span>Plan for setup/teardown time between DJs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">•</span>
                        <span>
                          Consider having background music during transitions
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPartialBookingModal(false);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel & Adjust
                </button>
                <button
                  onClick={async () => {
                    setShowPartialBookingModal(false);
                    await submitBookings();
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Confirm & Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
