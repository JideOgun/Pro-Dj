import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSubscription } from "@/hooks/useSubscription";
import { Calendar, Crown } from "lucide-react";
import toast from "react-hot-toast";

interface GalleryEventCounterProps {
  className?: string;
}

export function GalleryEventCounter({
  className = "",
}: GalleryEventCounterProps) {
  const { data: session } = useSession();
  const { hasActiveSubscription, loading } = useSubscription();
  const [eventCount, setEventCount] = useState<number>(0);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchEventCount = async () => {
      if (!session?.user || hasActiveSubscription) {
        setLoadingEvents(false);
        return;
      }

      try {
        const response = await fetch("/api/dj/event-photos");
        const data = await response.json();
        console.log("Gallery Event Counter - API Response:", data);

        if (data.ok) {
          // Count unique events (only count photos with valid event names)
          const uniqueEvents = new Set();
          data.data.photos.forEach((photo: any) => {
            if (photo.eventName && photo.eventName.trim() !== "") {
              uniqueEvents.add(photo.eventName);
            }
          });
          console.log(
            "Gallery Event Counter - All photos:",
            data.data.photos.map((p: any) => ({
              eventName: p.eventName,
              title: p.title,
            }))
          );
          console.log(
            "Gallery Event Counter - Unique events:",
            Array.from(uniqueEvents)
          );
          console.log(
            "Gallery Event Counter - Event count:",
            uniqueEvents.size
          );
          setEventCount(uniqueEvents.size);
        }
      } catch (error) {
        console.error("Error fetching event count:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEventCount();
  }, [session, hasActiveSubscription]);

  if (loading || loadingEvents) {
    return null;
  }

  // Don't show for subscribers or admins
  if (hasActiveSubscription) {
    return null;
  }

  const remainingEvents = Math.max(0, 2 - eventCount);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {remainingEvents > 0 ? (
        <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-200 text-xs font-medium rounded-full flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {remainingEvents} Free Event{remainingEvents === 1 ? "" : "s"}{" "}
          Remaining
        </span>
      ) : (
        <button
          onClick={async () => {
            try {
              const response = await fetch("/api/subscriptions/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  planType: "DJ_BASIC",
                  returnUrl: "/gallery",
                }),
              });

              const data = await response.json();

              if (response.ok && data.url) {
                window.location.href = data.url;
              } else {
                toast.error(
                  data.error || "Failed to create subscription checkout"
                );
              }
            } catch (error) {
              toast.error("Failed to start subscription process");
            }
          }}
          className="px-2 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium rounded-full flex items-center hover:bg-amber-200 transition-colors cursor-pointer"
        >
          <Crown className="w-3 h-3 mr-1" />
          Upgrade for Unlimited Events
        </button>
      )}
    </div>
  );
}
