"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import RowEditor from "./RowEditor";

interface PricingRow {
  id: string;
  type: string;
  key: string;
  label: string;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
}

interface DraggablePricingTableProps {
  type: string;
  rows: PricingRow[];
}

export default function DraggablePricingTable({
  type,
  rows,
}: DraggablePricingTableProps) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

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

      // Create new array with reordered items
      const newItems = [...items];
      const [draggedItemData] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItemData);

      // Update sort orders
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        sortOrder: index + 1,
      }));

      setItems(updatedItems);
      setDraggedItem(null);

      // Save the new order to the database
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
        // Revert to original order on error
        setItems(rows);
      }
    },
    [draggedItem, items, router]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  return (
    <section className="bg-gray-800 rounded-lg border border-gray-700/30 overflow-hidden">
      <div className="bg-gray-700/50 px-6 py-4 border-b border-gray-700/30">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
          {type} Packages
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          {items.length} package{items.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700/30 border-b border-gray-600/30">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                Package Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                Key
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                Price
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
            {items.map((row, index) => (
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
                <RowEditor
                  id={row.id}
                  label={row.label}
                  keyName={row.key}
                  priceCents={row.priceCents}
                  sortOrder={row.sortOrder}
                  isActive={row.isActive}
                  isDragging={draggedItem === row.id}
                  dragHandleProps={{}}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
