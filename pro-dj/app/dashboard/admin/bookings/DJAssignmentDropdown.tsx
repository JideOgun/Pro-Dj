"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface DJ {
  id: string;
  stageName: string | null;
  user: {
    name: string | null;
    email: string;
  };
  contractorStatus: string;
  stripeConnectAccountEnabled: boolean;
}

interface DJAssignmentDropdownProps {
  bookingId: string;
  currentDjId: string | null;
  requestedDjId?: string | null; // The DJ the client originally requested
  onAssignmentChange?: (djId: string | null) => void;
}

export default function DJAssignmentDropdown({
  bookingId,
  currentDjId,
  requestedDjId,
  onAssignmentChange,
}: DJAssignmentDropdownProps) {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [selectedDjId, setSelectedDjId] = useState<string | null>(currentDjId);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDjs, setIsLoadingDjs] = useState(true);
  const [assignedDjName, setAssignedDjName] = useState<string | null>(null);

  // Load available DJs
  useEffect(() => {
    const fetchDJs = async () => {
      try {
        const response = await fetch("/api/admin/djs/available");
        if (response.ok) {
          const data = await response.json();
          setDjs(data.djs || []);
        } else {
          toast.error("Failed to load DJs");
        }
      } catch (error) {
        toast.error("Failed to load DJs");
      } finally {
        setIsLoadingDjs(false);
      }
    };

    fetchDJs();
  }, []);

  // Initialize assigned DJ name when component loads
  useEffect(() => {
    if (currentDjId && djs.length > 0) {
      const currentDJ = djs.find((dj) => dj.id === currentDjId);
      if (currentDJ) {
        setAssignedDjName(currentDJ.stageName || currentDJ.user.name);
      }
    }
  }, [currentDjId, djs]);

  // Auto-assign requested DJ if available and no current DJ assigned
  useEffect(() => {
    if (
      requestedDjId &&
      djs.some((dj) => dj.id === requestedDjId) &&
      !currentDjId
    ) {
      // Auto-assign the requested DJ
      const autoAssign = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/admin/bookings/${bookingId}/assign-dj`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ djId: requestedDjId }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            setSelectedDjId(requestedDjId);
            const assignedDJ = djs.find((dj) => dj.id === requestedDjId);
            setAssignedDjName(
              assignedDJ?.stageName || assignedDJ?.user.name || null
            );
            onAssignmentChange?.(requestedDjId);

            // Enhanced auto-assignment message
            toast.success(
              `🤖 Auto-assigned requested DJ: ${result.assignment?.djName}`,
              {
                duration: 4000,
                style: {
                  background: "#8B5CF6",
                  color: "white",
                },
              }
            );

            // Show status update if it changed
            if (result.assignment?.statusChanged) {
              setTimeout(() => {
                toast.success(
                  `📋 Status updated to: ${result.assignment.newStatus}`,
                  {
                    duration: 3000,
                    style: {
                      background: "#3B82F6",
                      color: "white",
                    },
                  }
                );
              }, 1000);
            }

            window.location.reload(); // Refresh to update status
          } else {
            const error = await response.json();
            toast.error(error.error || "Failed to auto-assign DJ");
            setSelectedDjId(requestedDjId); // Still show as selected in UI
          }
        } catch (error) {
          console.error("Error auto-assigning DJ:", error);
          toast.error("Failed to auto-assign DJ");
          setSelectedDjId(requestedDjId); // Still show as selected in UI
        } finally {
          setIsLoading(false);
        }
      };
      autoAssign();
    } else if (currentDjId) {
      setSelectedDjId(currentDjId);
    } else if (requestedDjId && djs.some((dj) => dj.id === requestedDjId)) {
      setSelectedDjId(requestedDjId);
    }
  }, [requestedDjId, currentDjId, djs, bookingId, onAssignmentChange]);

  const handleDJAssignment = async (djId: string | null) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/bookings/${bookingId}/assign-dj`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ djId }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSelectedDjId(djId);
        onAssignmentChange?.(djId);

        if (djId) {
          const assignedDJ = djs.find((dj) => dj.id === djId);
          setAssignedDjName(
            assignedDJ?.stageName || assignedDJ?.user.name || null
          );

          // Enhanced success message with assignment details
          const message = result.assignment?.wasRequested
            ? `✅ DJ ${result.assignment.djName} assigned (as requested by client)`
            : `✅ DJ ${result.assignment.djName} assigned successfully`;

          toast.success(message, {
            duration: 4000,
            style: {
              background: "#10B981",
              color: "white",
            },
          });

          // Show additional info if status changed
          if (result.assignment?.statusChanged) {
            setTimeout(() => {
              toast.success(
                `📋 Booking status updated to: ${result.assignment.newStatus}`,
                {
                  duration: 3000,
                  style: {
                    background: "#3B82F6",
                    color: "white",
                  },
                }
              );
            }, 1000);
          }
        } else {
          setAssignedDjName(null);
          toast.success("DJ assignment removed", {
            duration: 3000,
            style: {
              background: "#EF4444",
              color: "white",
            },
          });
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign DJ");
      }
    } catch (error) {
      toast.error("Failed to assign DJ");
    } finally {
      setIsLoading(false);
    }
  };

  const getDJDisplayName = (dj: DJ) => {
    return dj.stageName || dj.user.name || dj.user.email;
  };

  const isRequestedDJ = (djId: string) => {
    return djId === requestedDjId;
  };

  if (isLoadingDjs) {
    return (
      <div className="min-w-[220px]">
        <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-400 text-sm">Loading DJs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-[220px]">
      <div className="relative">
        <select
          value={selectedDjId || ""}
          onChange={(e) => handleDJAssignment(e.target.value || null)}
          disabled={isLoading}
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all duration-200 hover:border-gray-500"
        >
          <option value="" className="text-gray-400">
            {isLoading ? "Loading DJs..." : "Select DJ"}
          </option>
          {djs.map((dj) => (
            <option
              key={dj.id}
              value={dj.id}
              className={`${
                isRequestedDJ(dj.id)
                  ? "bg-blue-900 text-blue-100"
                  : dj.contractorStatus === "ACTIVE"
                  ? "bg-gray-800 text-white"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {getDJDisplayName(dj)}
              {isRequestedDJ(dj.id) ? " (Requested)" : ""}
              {dj.contractorStatus !== "ACTIVE" ? " (Inactive)" : ""}
            </option>
          ))}
        </select>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {selectedDjId && (
        <div className="mt-2 text-xs text-gray-400">
          {djs.find((dj) => dj.id === selectedDjId)?.contractorStatus ===
          "ACTIVE"
            ? "Ready for assignment"
            : "Needs activation"}
        </div>
      )}

      {/* Loading message */}
      {isLoading && (
        <div className="mt-2 text-xs text-blue-400">Updating assignment...</div>
      )}

      {/* Currently assigned DJ */}
      {selectedDjId && assignedDjName && (
        <div className="mt-2 text-xs text-green-400 font-medium">
          Currently assigned: {assignedDjName}
        </div>
      )}
    </div>
  );
}
