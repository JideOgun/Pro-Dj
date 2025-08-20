"use client";

import { useState, useEffect } from "react";

import toast from "react-hot-toast";
import { Plus, Edit, Trash2, Save, X, Check, DollarSign } from "lucide-react";

interface DjAddon {
  addonKey: string;
  label: string;
  description: string;
  priceCents: number;
  isActive: boolean;
  isCustom: boolean;
  customCategory?: string | null;
}

export default function DjAddonManager() {
  const [addons, setAddons] = useState<DjAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAddon, setEditingAddon] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DjAddon>>({});
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState({
    label: "",
    description: "",
    priceCents: 0,
    customCategory: "",
  });

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dj/addons");
      const data = await response.json();

      if (response.ok) {
        setAddons(data.addons);
      } else {
        toast.error("Failed to load add-ons");
      }
    } catch (error) {
      console.error("Error fetching add-ons:", error);
      toast.error("Failed to load add-ons");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAddon = async (addonKey: string, isActive: boolean) => {
    try {
      const addon = addons.find((a) => a.addonKey === addonKey);
      if (!addon) return;

      const response = await fetch("/api/dj/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addon,
          isActive,
        }),
      });

      if (response.ok) {
        setAddons((prev) =>
          prev.map((a) => (a.addonKey === addonKey ? { ...a, isActive } : a))
        );
        toast.success(`${addon.label} ${isActive ? "enabled" : "disabled"}`);
      } else {
        toast.error("Failed to update add-on");
      }
    } catch (error) {
      console.error("Error updating add-on:", error);
      toast.error("Failed to update add-on");
    }
  };

  const handleEditAddon = (addon: DjAddon) => {
    setEditingAddon(addon.addonKey);
    setEditForm(addon);
  };

  const handleSaveEdit = async () => {
    if (!editingAddon) return;

    try {
      const response = await fetch("/api/dj/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setAddons((prev) =>
          prev.map((a) =>
            a.addonKey === editingAddon ? { ...a, ...editForm } : a
          )
        );
        setEditingAddon(null);
        setEditForm({});
        toast.success("Add-on updated successfully");
      } else {
        toast.error("Failed to update add-on");
      }
    } catch (error) {
      console.error("Error updating add-on:", error);
      toast.error("Failed to update add-on");
    }
  };

  const handleCancelEdit = () => {
    setEditingAddon(null);
    setEditForm({});
  };

  const handleDeleteAddon = async (addonKey: string) => {
    if (!confirm("Are you sure you want to delete this add-on?")) return;

    try {
      const response = await fetch(`/api/dj/addons?addonKey=${addonKey}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAddons((prev) => prev.filter((a) => a.addonKey !== addonKey));
        toast.success("Add-on deleted successfully");
      } else {
        toast.error("Failed to delete add-on");
      }
    } catch (error) {
      console.error("Error deleting add-on:", error);
      toast.error("Failed to delete add-on");
    }
  };

  const handleCreateCustomAddon = async () => {
    if (!customForm.label || customForm.priceCents <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const addonKey = `custom_${Date.now()}`;
      const response = await fetch("/api/dj/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addonKey,
          label: customForm.label,
          description: customForm.description,
          priceCents: customForm.priceCents,
          isActive: true,
          isCustom: true,
          customCategory: customForm.customCategory || null,
        }),
      });

      if (response.ok) {
        const newAddon = await response.json();
        setAddons((prev) => [...prev, newAddon.addon]);
        setShowCustomForm(false);
        setCustomForm({
          label: "",
          description: "",
          priceCents: 0,
          customCategory: "",
        });
        toast.success("Custom add-on created successfully");
      } else {
        toast.error("Failed to create custom add-on");
      }
    } catch (error) {
      console.error("Error creating custom add-on:", error);
      toast.error("Failed to create custom add-on");
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700/30">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700/30">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-violet-400">My Add-ons</h3>
        <button
          onClick={() => setShowCustomForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Custom
        </button>
      </div>

      <div className="space-y-4">
        {addons.map((addon) => (
          <div
            key={addon.addonKey}
            className={`p-4 rounded-lg border transition-colors ${
              addon.isActive
                ? "border-violet-500 bg-violet-900/10"
                : "border-gray-600 bg-gray-700/30"
            }`}
          >
            {editingAddon === addon.addonKey ? (
              // Edit mode
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={editForm.label || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, label: e.target.value })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Add-on name"
                    />
                    <textarea
                      value={editForm.description || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                      rows={2}
                      placeholder="Description"
                    />
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">
                          Price (USD)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={(editForm.priceCents / 100).toFixed(2)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setEditForm({
                                ...editForm,
                                priceCents: Math.round(value * 100),
                              });
                            }}
                            onBlur={(e) => {
                              // Format to 2 decimal places on blur
                              const value = parseFloat(e.target.value) || 0;
                              e.target.value = value.toFixed(2);
                            }}
                            className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Display mode
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-white">{addon.label}</h4>
                    {addon.isCustom && (
                      <span className="text-xs bg-blue-600 text-blue-100 px-2 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                    {addon.isActive ? (
                      <span className="text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-600 text-gray-100 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    {addon.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-violet-400 font-semibold">
                      ${(addon.priceCents / 100).toFixed(2)}
                    </span>
                    <button
                      onClick={() =>
                        handleToggleAddon(addon.addonKey, !addon.isActive)
                      }
                      className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                        addon.isActive
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {addon.isActive ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditAddon(addon)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {addon.isCustom && (
                    <button
                      onClick={() => handleDeleteAddon(addon.addonKey)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Add-on Form */}
      {showCustomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Add Custom Service
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={customForm.label}
                  onChange={(e) =>
                    setCustomForm({ ...customForm, label: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g., Live Saxophone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={customForm.description}
                  onChange={(e) =>
                    setCustomForm({
                      ...customForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3}
                  placeholder="Describe your custom service..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Price (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(customForm.priceCents / 100).toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setCustomForm({
                        ...customForm,
                        priceCents: Math.round(value * 100),
                      });
                    }}
                    onBlur={(e) => {
                      // Format to 2 decimal places on blur
                      const value = parseFloat(e.target.value) || 0;
                      e.target.value = value.toFixed(2);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter the price in dollars (e.g., 25.00 for $25)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={customForm.customCategory}
                  onChange={(e) =>
                    setCustomForm({
                      ...customForm,
                      customCategory: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g., Live Music, Special Effects"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateCustomAddon}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Create Add-on
              </button>
              <button
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomForm({
                    label: "",
                    description: "",
                    priceCents: 0,
                    customCategory: "",
                  });
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-colors"
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
