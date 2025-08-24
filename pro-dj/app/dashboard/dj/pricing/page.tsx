"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Settings,
  ArrowLeft,
  Clock,
  Plus,
  Edit,
  Save,
  X,
  Check,
  Package,
  Zap,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import DjAddonManager from "@/components/DjAddonManager";

interface DJProfile {
  id: string;
  stageName: string;
  basePriceCents: number | null;
  eventsOffered: string[];
  isAcceptingBookings: boolean;
  isApprovedByAdmin: boolean;
  isFeatured: boolean;
}

interface EventPricing {
  eventType: string;
  hourlyRateCents: number;
  description?: string;
}

const EVENT_TYPE_DESCRIPTIONS = {
  Wedding:
    "Requires MC duties, coordination with vendors, special requests, curated playlists, and extended hours",
  "Private Party":
    "Custom playlists, special requests, and personalized service for intimate gatherings",
  Corporate:
    "Professional presentation, appropriate music selection, and reliable equipment",
  Birthday:
    "Age-appropriate music, special requests, and celebratory atmosphere",
  Club: "Creative freedom, reading the crowd, and maintaining energy throughout the night",
} as const;

export default function DjPricingPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [eventPricing, setEventPricing] = useState<EventPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEventType, setEditingEventType] = useState<string | null>(null);
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Fetch profile and event pricing
      const [profileResponse, pricingResponse] = await Promise.all([
        fetch("/api/dj/dashboard/stats"),
        fetch("/api/dj/event-pricing"),
      ]);

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfile(data.profile);
      } else {
        toast.error("Failed to load profile");
      }

      if (pricingResponse.ok) {
        const pricingData = await pricingResponse.json();
        setEventPricing(pricingData.pricing || []);

        // Initialize editing rates
        const rates: Record<string, number> = {};
        pricingData.pricing?.forEach((pricing: EventPricing) => {
          rates[pricing.eventType] = pricing.hourlyRateCents / 100;
        });
        setEditingRates(rates);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEventRate = async (eventType: string) => {
    const rate = editingRates[eventType];
    if (!rate || rate <= 0) {
      toast.error("Hourly rate must be greater than $0");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/dj/event-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          hourlyRateCents: Math.round(rate * 100),
          description:
            EVENT_TYPE_DESCRIPTIONS[
              eventType as keyof typeof EVENT_TYPE_DESCRIPTIONS
            ],
        }),
      });

      if (response.ok) {
        // Update local state
        setEventPricing((prev) => {
          const existing = prev.find((p) => p.eventType === eventType);
          if (existing) {
            return prev.map((p) =>
              p.eventType === eventType
                ? { ...p, hourlyRateCents: Math.round(rate * 100) }
                : p
            );
          } else {
            return [
              ...prev,
              {
                eventType,
                hourlyRateCents: Math.round(rate * 100),
                description:
                  EVENT_TYPE_DESCRIPTIONS[
                    eventType as keyof typeof EVENT_TYPE_DESCRIPTIONS
                  ],
              },
            ];
          }
        });

        setEditingEventType(null);
        toast.success(`${eventType} rate updated successfully`);
      } else {
        toast.error("Failed to update hourly rate");
      }
    } catch (error) {
      console.error("Error updating hourly rate:", error);
      toast.error("Failed to update hourly rate");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (eventType: string) => {
    const existing = eventPricing.find((p) => p.eventType === eventType);
    setEditingRates((prev) => ({
      ...prev,
      [eventType]: existing ? existing.hourlyRateCents / 100 : 0,
    }));
    setEditingEventType(null);
  };

  const getEventRate = (eventType: string): number => {
    const pricing = eventPricing.find((p) => p.eventType === eventType);
    return pricing ? pricing.hourlyRateCents / 100 : 0;
  };

  const handleAddEventType = async (eventType: string) => {
    try {
      setSaving(true);
      const response = await fetch("/api/dj/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventsOffered: [...(profile?.eventsOffered || []), eventType],
        }),
      });

      if (response.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                eventsOffered: [...(prev.eventsOffered || []), eventType],
              }
            : null
        );
        setShowAddEventModal(false);
        toast.success(`${eventType} added to your services`);
      } else {
        toast.error("Failed to add event type");
      }
    } catch (error) {
      console.error("Error adding event type:", error);
      toast.error("Failed to add event type");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEventType = async (eventType: string) => {
    try {
      setSaving(true);
      const updatedEvents = (profile?.eventsOffered || []).filter(
        (event) => event !== eventType
      );

      const response = await fetch("/api/dj/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventsOffered: updatedEvents,
        }),
      });

      if (response.ok) {
        setProfile((prev) =>
          prev ? { ...prev, eventsOffered: updatedEvents } : null
        );
        toast.success(`${eventType} removed from your services`);
      } else {
        toast.error("Failed to remove event type");
      }
    } catch (error) {
      console.error("Error removing event type:", error);
      toast.error("Failed to remove event type");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-violet-400" />
                Pricing & Add-ons
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">
                Set your hourly rate and manage your service add-ons
              </p>
            </div>
            <Link
              href="/dashboard/dj"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {eventPricing.length}
                </p>
                <p className="text-gray-400 text-sm">Event Types Set</p>
              </div>
              <Clock className="w-8 h-8 text-violet-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {profile?.isAcceptingBookings ? "Active" : "Inactive"}
                </p>
                <p className="text-gray-400 text-sm">Status</p>
              </div>
              <Settings className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {profile?.isApprovedByAdmin ? "✓" : "—"}
                </p>
                <p className="text-gray-400 text-sm">Verified</p>
              </div>
              <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Event-Specific Pricing Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700/30 mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-violet-400 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Event-Specific Pricing
              </h3>
              <p className="text-gray-300 text-sm mt-1">
                Set different hourly rates for different types of events
              </p>
            </div>
            <button
              onClick={() => setShowAddEventModal(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 self-start"
            >
              <Plus className="w-4 h-4" />
              Add Event Type
            </button>
          </div>

          {/* Event Type Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(EVENT_TYPE_DESCRIPTIONS)
              .filter((eventType) =>
                profile?.eventsOffered?.includes(eventType)
              )
              .map((eventType) => {
                const isEditing = editingEventType === eventType;
                const currentRate = getEventRate(eventType);
                const editingRate = editingRates[eventType] || 0;

                return (
                  <div
                    key={eventType}
                    className="bg-gray-700/50 rounded-lg p-6 border border-gray-600/30"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-1">
                          {eventType}
                        </h4>
                        <p className="text-gray-300 text-sm">
                          {
                            EVENT_TYPE_DESCRIPTIONS[
                              eventType as keyof typeof EVENT_TYPE_DESCRIPTIONS
                            ]
                          }
                        </p>
                      </div>
                      {!isEditing && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => {
                              setEditingEventType(eventType);
                              setEditingRates((prev) => ({
                                ...prev,
                                [eventType]: currentRate,
                              }));
                            }}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            {currentRate > 0 ? "Edit" : "Set Rate"}
                          </button>
                          <button
                            onClick={() => handleRemoveEventType(eventType)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Hourly Rate (USD)
                          </label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingRate.toFixed(2)}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  setEditingRates((prev) => ({
                                    ...prev,
                                    [eventType]: value,
                                  }));
                                }}
                                onBlur={(e) => {
                                  // Format to 2 decimal places on blur
                                  const value = parseFloat(e.target.value) || 0;
                                  e.target.value = value.toFixed(2);
                                }}
                                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEventRate(eventType)}
                                disabled={saving}
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                {saving ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    Save
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleCancelEdit(eventType)}
                                className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                          <div>
                            <div className="text-2xl font-bold text-white">
                              ${currentRate.toFixed(2)}
                            </div>
                            <div className="text-gray-400 text-sm">
                              per hour
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">
                              Example for 4-hour event:
                            </div>
                            <div className="text-lg font-semibold text-violet-400">
                              ${(currentRate * 4).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {currentRate === 0 && (
                          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-amber-400" />
                              <span className="text-amber-200 font-medium">
                                Set your {eventType} rate to receive bookings
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Pricing Strategy Info */}
          <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <h4 className="text-blue-200 font-semibold">
                Event-Specific Pricing Strategy
              </h4>
            </div>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>
                • <strong>Weddings:</strong> Higher rates for MC duties,
                coordination, and special requests
              </li>
              <li>
                • <strong>Private Parties:</strong> Premium rates for
                personalized service and custom playlists
              </li>
              <li>
                • <strong>Corporate:</strong> Professional rates for formal
                events and reliable equipment
              </li>
              <li>
                • <strong>Birthdays:</strong> Moderate rates for age-appropriate
                music and special requests
              </li>
              <li>
                • <strong>Clubs:</strong> Standard rates with creative freedom
                and crowd reading
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Add-ons Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <DjAddonManager />
        </motion.div>
      </div>

      {/* Add Event Type Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Add Event Type
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Select an event type to add to your services:
            </p>
            <div className="space-y-2 mb-6">
              {Object.keys(EVENT_TYPE_DESCRIPTIONS)
                .filter(
                  (eventType) => !profile?.eventsOffered?.includes(eventType)
                )
                .map((eventType) => (
                  <button
                    key={eventType}
                    onClick={() => handleAddEventType(eventType)}
                    disabled={saving}
                    className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-white">{eventType}</div>
                    <div className="text-sm text-gray-400">
                      {
                        EVENT_TYPE_DESCRIPTIONS[
                          eventType as keyof typeof EVENT_TYPE_DESCRIPTIONS
                        ]
                      }
                    </div>
                  </button>
                ))}
            </div>
            {Object.keys(EVENT_TYPE_DESCRIPTIONS).filter(
              (eventType) => !profile?.eventsOffered?.includes(eventType)
            ).length === 0 && (
              <div className="text-center text-gray-400 py-4">
                You already offer all available event types!
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddEventModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
