"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Edit, Trash2, Save, X, GripVertical } from "lucide-react";
import EditPackageModal from "./EditPackageModal";

interface PricingRow {
  id: string;
  type: string;
  key: string;
  label: string;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
}

interface PackageManagerProps {
  type: string;
  rows: PricingRow[];
}

export default function PackageManager({ type, rows }: PackageManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<PricingRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPackage, setNewPackage] = useState({
    label: "",
    price: "",
    isActive: true,
  });

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: string) => {
      e.preventDefault();

      if (!draggedItem || draggedItem === targetId) {
        setDraggedItem(null);
        return;
      }

      const draggedIndex = items.findIndex((item) => item.id === draggedItem);
      const targetIndex = items.findIndex((item) => item.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedItem(null);
        return;
      }

      const newItems = [...items];
      const [draggedItemData] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItemData);

      const updatedItems = newItems.map((item, index) => ({
        ...item,
        sortOrder: index + 1,
      }));

      setItems(updatedItems);
      setDraggedItem(null);

      try {
        const updatePromises = updatedItems.map((item) =>
          fetch(`/api/pricing/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sortOrder: item.sortOrder,
            }),
          })
        );

        await Promise.all(updatePromises);
        toast.success("Package order updated");
        router.refresh();
      } catch (error) {
        toast.error("Failed to update package order");
        setItems(rows);
      }
    },
    [draggedItem, items, router, rows]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  // Add new package
  const handleAddPackage = async () => {
    if (!newPackage.label.trim() || !newPackage.price.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const priceCents = Math.round(parseFloat(newPackage.price) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          label: newPackage.label.trim(),
          priceCents,
          isActive: newPackage.isActive,
          sortOrder: items.length + 1,
        }),
      });

      if (response.ok) {
        const newPackageData = await response.json();
        // Add the new package to the local state immediately
        setItems([...items, newPackageData]);
        toast.success("Package added successfully");
        setShowAddForm(false);
        setNewPackage({ label: "", price: "", isActive: true });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add package");
      }
    } catch (error) {
      toast.error("Failed to add package");
    }
  };

  // Delete package
  const handleDeletePackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) {
      return;
    }

    try {
      const response = await fetch(`/api/pricing/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the package from local state immediately
        setItems(items.filter((item) => item.id !== id));
        toast.success("Package deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete package");
      }
    } catch (error) {
      toast.error("Failed to delete package");
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg border border-gray-700/30 overflow-hidden">
      <div className="bg-gray-700/50 px-6 py-4 border-b border-gray-700/30">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
              {type} Packages
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {items.length} package{items.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Package
          </button>
        </div>
      </div>

      {/* Add Package Form */}
      {showAddForm && (
        <div className="bg-gray-700/20 p-6 border-b border-gray-700/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Package Name
              </label>
              <input
                type="text"
                value={newPackage.label}
                onChange={(e) =>
                  setNewPackage({ ...newPackage, label: e.target.value })
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
                 value={newPackage.price}
                 onChange={(e) =>
                   setNewPackage({ ...newPackage, price: e.target.value })
                 }
                 placeholder="0.00"
                 className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
               />
               <p className="text-xs text-gray-400 mt-1">
                 This is the base rate per hour. Final price will be calculated based on event duration.
               </p>
             </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPackage.isActive}
                  onChange={(e) =>
                    setNewPackage({ ...newPackage, isActive: e.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 bg-gray-600 rounded-full transition-colors duration-200 ease-in-out ${
                    newPackage.isActive ? "bg-violet-600" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out transform ${
                      newPackage.isActive ? "translate-x-5" : "translate-x-1"
                    } mt-1`}
                  />
                </div>
                <span className="text-sm text-gray-300">Active</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleAddPackage}
                  className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Save size={14} />
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPackage({ label: "", price: "", isActive: true });
                  }}
                  className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700/30 border-b border-gray-600/30">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                Package Name
              </th>
                                   <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                       Base Price/Hour
                     </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {items.map((row) => (
              <tr
                key={row.id}
                draggable
                onDragStart={(e) => handleDragStart(e, row.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, row.id)}
                onDragEnd={handleDragEnd}
                className={`hover:bg-gray-700/20 transition-colors ${
                  draggedItem === row.id ? "opacity-50" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-300 transition-colors">
                      <GripVertical size={16} />
                    </div>
                    <span className="text-white font-medium">{row.label}</span>
                  </div>
                </td>
                                 <td className="px-6 py-4">
                   <div>
                     <span className="font-semibold text-green-400">
                       ${(row.priceCents / 100).toFixed(2)}
                     </span>
                     <div className="text-xs text-gray-400">
                       per hour
                     </div>
                   </div>
                 </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      row.isActive
                        ? "bg-green-900/30 text-green-200 border border-green-700/30"
                        : "bg-gray-900/30 text-gray-200 border border-gray-700/30"
                    }`}
                  >
                    {row.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingPackage(row)}
                      className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg text-white transition-colors"
                      title="Edit package"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(row.id)}
                      className="bg-red-600 hover:bg-red-700 p-2 rounded-lg text-white transition-colors"
                      title="Delete package"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-300">
            No {type} Packages
          </h3>
          <p className="text-gray-400 mb-4">
            Get started by adding your first package.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus size={16} />
            Add First Package
          </button>
        </div>
      )}

      {/* Edit Package Modal */}
      <EditPackageModal
        isOpen={!!editingPackage}
        onClose={() => setEditingPackage(null)}
        package={editingPackage}
      />
    </section>
  );
}
