import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSubscription } from "@/hooks/useSubscription";
import { Upload, Crown } from "lucide-react";
import toast from "react-hot-toast";

interface FreeUploadCounterProps {
  className?: string;
}

export function FreeUploadCounter({ className = "" }: FreeUploadCounterProps) {
  const { data: session } = useSession();
  const { hasActiveSubscription, loading } = useSubscription();
  const [mixCount, setMixCount] = useState<number>(0);
  const [loadingMixes, setLoadingMixes] = useState(true);

  useEffect(() => {
    const fetchMixCount = async () => {
      if (!session?.user) {
        setLoadingMixes(false);
        return;
      }

      // Only fetch mix count for users without active subscriptions
      if (hasActiveSubscription) {
        setLoadingMixes(false);
        return;
      }

      try {
        const response = await fetch("/api/mixes");
        const data = await response.json();
        console.log("FreeUploadCounter - API Response:", data);

        if (data.ok) {
          // Count mixes for the current user
          const userMixes = data.mixes.filter(
            (mix: { dj: { userId: string } }) =>
              mix.dj.userId === session.user.id
          );
          console.log(
            "FreeUploadCounter - User mixes count:",
            userMixes.length
          );
          setMixCount(userMixes.length);
        }
      } catch (error) {
        console.error("Error fetching mix count:", error);
      } finally {
        setLoadingMixes(false);
      }
    };

    fetchMixCount();
  }, [session, hasActiveSubscription]);

  console.log("FreeUploadCounter Debug:", {
    loading,
    loadingMixes,
    hasActiveSubscription,
    mixCount,
    session: session?.user?.email,
    role: session?.user?.role,
  });

  if (loading || loadingMixes) {
    console.log("FreeUploadCounter: Hidden due to loading");
    return null;
  }

  // Don't show for subscribers or admins
  if (hasActiveSubscription) {
    console.log("FreeUploadCounter: Hidden due to active subscription");
    return null;
  }

  const remainingUploads = Math.max(0, 2 - mixCount);
  console.log(
    "FreeUploadCounter: Will show counter, remainingUploads:",
    remainingUploads
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {remainingUploads > 0 ? (
        <button
          onClick={async () => {
            try {
              const response = await fetch("/api/subscriptions/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  planType: "DJ_BASIC",
                  returnUrl: "/mixes",
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
          className="px-2 py-1 bg-green-100 text-green-800 border border-green-200 text-xs font-medium rounded-full flex items-center hover:bg-green-200 transition-colors cursor-pointer"
        >
          <Upload className="w-3 h-3 mr-1" />
          {remainingUploads} Free Upload{remainingUploads === 1 ? "" : "s"}{" "}
          Remaining
          <span className="ml-1 text-green-600">• Subscribe for Unlimited</span>
        </button>
      ) : (
        <button
          onClick={async () => {
            try {
              const response = await fetch("/api/subscriptions/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  planType: "DJ_BASIC",
                  returnUrl: "/mixes",
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
          Upgrade for Unlimited Uploads
        </button>
      )}
    </div>
  );
}
