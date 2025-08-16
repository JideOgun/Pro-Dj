"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

interface EventType {
  type: string;
  packageCount: number;
}

interface EventTypeManagerProps {
  eventTypes: EventType[];
}

export default function EventTypeManager({
  eventTypes,
}: EventTypeManagerProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [newEventType, setNewEventType] = useState("");
  const [editEventType, setEditEventType] = useState("");

  const handleAddEventType = async () => {
    if (!newEventType.trim()) {
      toast.error("Please enter an event type name");
      return;
    }

    // Check if event type already exists
    if (
      eventTypes.some(
        (et) => et.type.toLowerCase() === newEventType.trim().toLowerCase()
      )
    ) {
      toast.error("Event type already exists");
      return;
    }

    try {
      const response = await fetch("/api/pricing/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newEventType.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Event type added successfully");
        setShowAddForm(false);
        setNewEventType("");
        // Force a page refresh to show the new event type
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add event type");
      }
    } catch (error) {
      toast.error("Failed to add event type");
    }
  };

  const handleEditEventType = async (oldType: string) => {
    if (!editEventType.trim()) {
      toast.error("Please enter an event type name");
      return;
    }

    // Check if new name already exists
    if (
      eventTypes.some(
        (et) =>
          et.type.toLowerCase() === editEventType.trim().toLowerCase() &&
          et.type !== oldType
      )
    ) {
      toast.error("Event type already exists");
      return;
    }

    try {
      const response = await fetch("/api/pricing/event-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldType,
          newType: editEventType.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Event type updated successfully");
        setEditingType(null);
        setEditEventType("");
        // Force a page refresh to show the updated event type
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update event type");
      }
    } catch (error) {
      toast.error("Failed to update event type");
    }
  };

  const handleDeleteEventType = async (type: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${type}"? This will also delete all packages in this event type.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/pricing/event-types/${encodeURIComponent(type)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Event type deleted successfully");
        // Force a page refresh to show the updated event types
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete event type");
      }
    } catch (error) {
      toast.error("Failed to delete event type");
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg border border-gray-700/30 overflow-hidden mb-8">
      <div className="bg-gray-700/50 px-6 py-4 border-b border-gray-700/30">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Event Types
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Manage different types of events and their packages
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Event Type
          </button>
        </div>
      </div>

      {/* Add Event Type Form */}
      {showAddForm && (
        <div className="bg-gray-700/20 p-6 border-b border-gray-700/30">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Type Name
              </label>
              <input
                type="text"
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
                placeholder="e.g., Graduation Party"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddEventType}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Save size={14} />
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewEventType("");
                }}
                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700/30 border-b border-gray-600/30">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                Event Type
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                Packages
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {eventTypes.map((eventType) => (
              <tr
                key={eventType.type}
                className="hover:bg-gray-700/20 transition-colors"
              >
                <td className="px-6 py-4">
                  {editingType === eventType.type ? (
                    <input
                      type="text"
                      value={editEventType}
                      onChange={(e) => setEditEventType(e.target.value)}
                      className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  ) : (
                    <span className="text-white font-medium">
                      {eventType.type}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-violet-900/30 text-violet-200 border border-violet-700/30">
                    {eventType.packageCount} package
                    {eventType.packageCount !== 1 ? "s" : ""}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {editingType === eventType.type ? (
                      <>
                        <button
                          onClick={() => handleEditEventType(eventType.type)}
                          className="bg-green-600 hover:bg-green-700 p-2 rounded-lg text-white transition-colors"
                          title="Save changes"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingType(null);
                            setEditEventType("");
                          }}
                          className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg text-white transition-colors"
                          title="Cancel edit"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingType(eventType.type);
                            setEditEventType(eventType.type);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg text-white transition-colors"
                          title="Edit event type"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteEventType(eventType.type)}
                          className="bg-red-600 hover:bg-red-700 p-2 rounded-lg text-white transition-colors"
                          title="Delete event type"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {eventTypes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-300">
            No Event Types
          </h3>
          <p className="text-gray-400 mb-4">
            Get started by adding your first event type.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus size={16} />
            Add First Event Type
          </button>
        </div>
      )}
    </section>
  );
}
