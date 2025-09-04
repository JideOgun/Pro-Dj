"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import {
  DollarSign,
  Plus,
  Edit,
  Trash,
  Settings,
  TrendingUp,
  Package,
  Clock,
  MapPin,
} from "lucide-react";

interface ServicePricing {
  id: string;
  eventType: string;
  basePricePerHour: number;
  regionMultiplier: number;
  minimumHours: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProDjAddon {
  id: string;
  name: string;
  description: string;
  priceFixed: number | null;
  pricePerHour: number | null;
  category: string;
  isActive: boolean;
  requiresSpecialEquipment: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPricingPage() {
  const { data: session } = useSession();

  // Check admin access
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [servicePricing, setServicePricing] = useState<ServicePricing[]>([]);
  const [proDjAddons, setProDjAddons] = useState<ProDjAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pricing");

  // Modal states
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<ServicePricing | null>(
    null
  );
  const [editingAddon, setEditingAddon] = useState<ProDjAddon | null>(null);

  // Form states
  const [pricingForm, setPricingForm] = useState({
    eventType: "",
    basePricePerHour: "",
    regionMultiplier: "1.0",
    minimumHours: "4",
    description: "",
  });

  const [addonForm, setAddonForm] = useState({
    name: "",
    description: "",
    priceFixed: "",
    pricePerHour: "",
    category: "",
    requiresSpecialEquipment: false,
  });

  const eventTypes = [
    "Wedding",
    "Corporate",
    "Birthday",
    "Private Party",
    "Club",
    "Graduation",
    "Anniversary",
    "Holiday Party",
  ];

  const addonCategories = [
    "Lighting",
    "Sound",
    "MC Services",
    "Equipment",
    "Entertainment",
    "Special Effects",
    "Photography",
    "Videography",
  ];

  // Load data
  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    setLoading(true);
    try {
      const [pricingRes, addonsRes] = await Promise.all([
        fetch("/api/admin/pricing/service-pricing"),
        fetch("/api/admin/pricing/addons"),
      ]);

      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        setServicePricing(pricingData.pricing || []);
      }

      if (addonsRes.ok) {
        const addonsData = await addonsRes.json();
        setProDjAddons(addonsData.addons || []);
      }
    } catch (error) {
      console.error("Error loading pricing data:", error);
      toast.error("Failed to load pricing data");
    } finally {
      setLoading(false);
    }
  };

  // Service pricing functions
  const handleCreatePricing = () => {
    setPricingForm({
      eventType: "",
      basePricePerHour: "",
      regionMultiplier: "1.0",
      minimumHours: "4",
      description: "",
    });
    setEditingPricing(null);
    setShowPricingModal(true);
  };

  const handleEditPricing = (pricing: ServicePricing) => {
    setPricingForm({
      eventType: pricing.eventType,
      basePricePerHour: (pricing.basePricePerHour / 100).toString(),
      regionMultiplier: pricing.regionMultiplier.toString(),
      minimumHours: pricing.minimumHours.toString(),
      description: pricing.description || "",
    });
    setEditingPricing(pricing);
    setShowPricingModal(true);
  };

  const handleSavePricing = async () => {
    try {
      const body = {
        eventType: pricingForm.eventType,
        basePricePerHour: Math.round(
          parseFloat(pricingForm.basePricePerHour) * 100
        ),
        regionMultiplier: parseFloat(pricingForm.regionMultiplier),
        minimumHours: parseInt(pricingForm.minimumHours),
        description: pricingForm.description || null,
      };

      const response = await fetch("/api/admin/pricing/service-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingPricing ? "Pricing updated!" : "Pricing created!");
        setShowPricingModal(false);
        loadPricingData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save pricing");
      }
    } catch (error) {
      toast.error("Failed to save pricing");
    }
  };

  const handleDeletePricing = async (eventType: string) => {
    if (!confirm("Are you sure you want to delete this pricing?")) return;

    try {
      const response = await fetch(
        `/api/admin/pricing/service-pricing?eventType=${eventType}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Pricing deleted!");
        loadPricingData();
      } else {
        toast.error("Failed to delete pricing");
      }
    } catch (error) {
      toast.error("Failed to delete pricing");
    }
  };

  // Add-on functions
  const handleCreateAddon = () => {
    setAddonForm({
      name: "",
      description: "",
      priceFixed: "",
      pricePerHour: "",
      category: "",
      requiresSpecialEquipment: false,
    });
    setEditingAddon(null);
    setShowAddonModal(true);
  };

  const handleEditAddon = (addon: ProDjAddon) => {
    setAddonForm({
      name: addon.name,
      description: addon.description,
      priceFixed: addon.priceFixed ? (addon.priceFixed / 100).toString() : "",
      pricePerHour: addon.pricePerHour
        ? (addon.pricePerHour / 100).toString()
        : "",
      category: addon.category,
      requiresSpecialEquipment: addon.requiresSpecialEquipment,
    });
    setEditingAddon(addon);
    setShowAddonModal(true);
  };

  const handleSaveAddon = async () => {
    try {
      const body = {
        name: addonForm.name,
        description: addonForm.description,
        priceFixed: addonForm.priceFixed
          ? Math.round(parseFloat(addonForm.priceFixed) * 100)
          : null,
        pricePerHour: addonForm.pricePerHour
          ? Math.round(parseFloat(addonForm.pricePerHour) * 100)
          : null,
        category: addonForm.category,
        requiresSpecialEquipment: addonForm.requiresSpecialEquipment,
      };

      const url = editingAddon
        ? `/api/admin/pricing/addons/${editingAddon.id}`
        : "/api/admin/pricing/addons";

      const method = editingAddon ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingAddon ? "Add-on updated!" : "Add-on created!");
        setShowAddonModal(false);
        loadPricingData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save add-on");
      }
    } catch (error) {
      toast.error("Failed to save add-on");
    }
  };

  const handleDeleteAddon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this add-on?")) return;

    try {
      const response = await fetch(`/api/admin/pricing/addons/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Add-on deleted!");
        loadPricingData();
      } else {
        toast.error("Failed to delete add-on");
      }
    } catch (error) {
      toast.error("Failed to delete add-on");
    }
  };

  const handleToggleAddonStatus = async (addon: ProDjAddon) => {
    try {
      const response = await fetch(`/api/admin/pricing/addons/${addon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !addon.isActive }),
      });

      if (response.ok) {
        toast.success(`Add-on ${addon.isActive ? "disabled" : "enabled"}!`);
        loadPricingData();
      } else {
        toast.error("Failed to update add-on status");
      }
    } catch (error) {
      toast.error("Failed to update add-on status");
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pro-DJ Pricing Management</h1>
          <p className="text-gray-300">
            Manage standardized pricing and add-ons for your premium service
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("pricing")}
              className={`px-6 py-3 font-medium ${
                activeTab === "pricing"
                  ? "text-violet-400 border-b-2 border-violet-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <DollarSign className="w-5 h-5 inline mr-2" />
              Service Pricing
            </button>
            <button
              onClick={() => setActiveTab("addons")}
              className={`px-6 py-3 font-medium ${
                activeTab === "addons"
                  ? "text-violet-400 border-b-2 border-violet-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Package className="w-5 h-5 inline mr-2" />
              Add-ons
            </button>
          </div>
        </div>

        {/* Service Pricing Tab */}
        {activeTab === "pricing" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Service Pricing</h2>
              <button
                onClick={handleCreatePricing}
                className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Event Type
              </button>
            </div>

            <div className="grid gap-4">
              {servicePricing.map((pricing) => (
                <div key={pricing.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {pricing.eventType}
                        </h3>
                        <span className="bg-violet-600 text-violet-100 px-2 py-1 rounded text-sm">
                          {formatPrice(pricing.basePricePerHour)}/hour
                        </span>
                        {pricing.regionMultiplier !== 1 && (
                          <span className="bg-orange-600 text-orange-100 px-2 py-1 rounded text-sm">
                            {pricing.regionMultiplier}x region
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 mb-3">
                        {pricing.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Min {pricing.minimumHours}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>Base rate × {pricing.regionMultiplier}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditPricing(pricing)}
                        className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePricing(pricing.eventType)}
                        className="bg-red-600 hover:bg-red-700 p-2 rounded-lg"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons Tab */}
        {activeTab === "addons" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Professional Add-ons</h2>
              <button
                onClick={handleCreateAddon}
                className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Add-on
              </button>
            </div>

            {/* Group by category */}
            {Object.entries(
              proDjAddons.reduce((acc, addon) => {
                if (!acc[addon.category]) acc[addon.category] = [];
                acc[addon.category].push(addon);
                return acc;
              }, {} as Record<string, ProDjAddon[]>)
            ).map(([category, addons]) => (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-violet-400">
                  {category}
                </h3>
                <div className="grid gap-4">
                  {addons.map((addon) => (
                    <div key={addon.id} className="bg-gray-800 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold">
                              {addon.name}
                            </h4>
                            <span className="bg-violet-600 text-violet-100 px-2 py-1 rounded text-sm">
                              {addon.priceFixed
                                ? formatPrice(addon.priceFixed)
                                : `${formatPrice(addon.pricePerHour!)}/hour`}
                            </span>
                            {addon.requiresSpecialEquipment && (
                              <span className="bg-orange-600 text-orange-100 px-2 py-1 rounded text-sm">
                                Special Equipment
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                addon.isActive
                                  ? "bg-green-600 text-green-100"
                                  : "bg-gray-600 text-gray-300"
                              }`}
                            >
                              {addon.isActive ? "Active" : "Disabled"}
                            </span>
                          </div>
                          <p className="text-gray-300">{addon.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleAddonStatus(addon)}
                            className={`px-3 py-1 rounded text-sm ${
                              addon.isActive
                                ? "bg-gray-600 hover:bg-gray-700 text-gray-300"
                                : "bg-green-600 hover:bg-green-700 text-green-100"
                            }`}
                          >
                            {addon.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => handleEditAddon(addon)}
                            className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddon(addon.id)}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded-lg"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pricing Modal */}
        {showPricingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">
                {editingPricing
                  ? "Edit Service Pricing"
                  : "Add Service Pricing"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Event Type
                  </label>
                  <select
                    value={pricingForm.eventType}
                    onChange={(e) =>
                      setPricingForm({
                        ...pricingForm,
                        eventType: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    disabled={!!editingPricing}
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Base Price Per Hour ($)
                  </label>
                  <input
                    type="number"
                    value={pricingForm.basePricePerHour}
                    onChange={(e) =>
                      setPricingForm({
                        ...pricingForm,
                        basePricePerHour: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    placeholder="250"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Region Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricingForm.regionMultiplier}
                    onChange={(e) =>
                      setPricingForm({
                        ...pricingForm,
                        regionMultiplier: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minimum Hours
                  </label>
                  <input
                    type="number"
                    value={pricingForm.minimumHours}
                    onChange={(e) =>
                      setPricingForm({
                        ...pricingForm,
                        minimumHours: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={pricingForm.description}
                    onChange={(e) =>
                      setPricingForm({
                        ...pricingForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePricing}
                  className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add-on Modal */}
        {showAddonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">
                {editingAddon ? "Edit Add-on" : "Add New Add-on"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={addonForm.name}
                    onChange={(e) =>
                      setAddonForm({ ...addonForm, name: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    placeholder="Premium Lighting Package"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={addonForm.description}
                    onChange={(e) =>
                      setAddonForm({
                        ...addonForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={addonForm.category}
                    onChange={(e) =>
                      setAddonForm({ ...addonForm, category: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                  >
                    <option value="">Select category</option>
                    {addonCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fixed Price ($)
                    </label>
                    <input
                      type="number"
                      value={addonForm.priceFixed}
                      onChange={(e) =>
                        setAddonForm({
                          ...addonForm,
                          priceFixed: e.target.value,
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      placeholder="350"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Per Hour ($)
                    </label>
                    <input
                      type="number"
                      value={addonForm.pricePerHour}
                      onChange={(e) =>
                        setAddonForm({
                          ...addonForm,
                          pricePerHour: e.target.value,
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      placeholder="75"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="special-equipment"
                    checked={addonForm.requiresSpecialEquipment}
                    onChange={(e) =>
                      setAddonForm({
                        ...addonForm,
                        requiresSpecialEquipment: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <label htmlFor="special-equipment" className="text-sm">
                    Requires special equipment
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddonModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddon}
                  className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
