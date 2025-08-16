"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X, Save } from "lucide-react";

interface PricingRow {
  id: string;
  type: string;
  key: string;
  label: string;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
}

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: PricingRow | null;
}

export default function EditPackageModal({
  isOpen,
  onClose,
  package: packageData,
}: EditPackageModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    label: "",
    price: "",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (packageData) {
      setFormData({
        label: packageData.label,
        price: (packageData.priceCents / 100).toFixed(2),
        isActive: packageData.isActive,
      });
    }
  }, [packageData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!packageData) return;

    if (!formData.label.trim() || !formData.price.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const priceCents = Math.round(parseFloat(formData.price) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/pricing/${packageData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formData.label.trim(),
          priceCents,
          isActive: formData.isActive,
        }),
      });

      if (response.ok) {
        toast.success("Package updated successfully");
        onClose();
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update package");
      }
    } catch (error) {
      toast.error("Failed to update package");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !packageData) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Edit Package</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Package Name
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="e.g., Premium Package"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>

                     <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Base Price per Hour ($)
             </label>
             <input
               type="number"
               step="0.01"
               min="0"
               value={formData.price}
               onChange={(e) =>
                 setFormData({ ...formData, price: e.target.value })
               }
               placeholder="0.00"
               className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
             />
             <p className="text-xs text-gray-400 mt-1">
               This is the base rate per hour. Final price will be calculated based on event duration.
             </p>
           </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="sr-only"
              />
              <div
                className={`w-10 h-6 bg-gray-600 rounded-full transition-colors duration-200 ease-in-out ${
                  formData.isActive ? "bg-violet-600" : "bg-gray-600"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out transform ${
                    formData.isActive ? "translate-x-5" : "translate-x-1"
                  } mt-1`}
                />
              </div>
              <span className="text-sm text-gray-300">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
