"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { GripVertical } from "lucide-react";

type Props = {
  id: string;
  label: string;
  keyName: string;
  priceCents: number;
  sortOrder: number;
  isActive: boolean;
  onReorder?: (id: string, newSortOrder: number) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
};

function toDollarString(cents: number) {
  return (cents / 100).toFixed(2);
}
function toCents(input: string) {
  // strip $ and commas, clamp to >= 0, round to cents
  const n = Number(input.replace(/[,$]/g, "").replace(/^\$/, ""));
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export default function RowEditor(p: Props) {
  const router = useRouter();

  // local state mirrors server values
  const [label, setLabel] = useState(p.label);
  const [price, setPrice] = useState(toDollarString(p.priceCents)); // display in dollars
  const [isActive, setIsActive] = useState(p.isActive);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // dirty-state tracking
  const dirty = useMemo(() => {
    return (
      label.trim() !== p.label ||
      toCents(price) !== p.priceCents ||
      isActive !== p.isActive
    );
  }, [label, price, isActive, p]);

  // guard price input to valid money format
  function onPriceChange(v: string) {
    // allow user to type freely but restrict to [digits][.digits]
    const next = v.replace(/[^\d.]/g, "");
    const parts = next.split(".");
    const safe =
      parts.length > 2
        ? `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`
        : parts.length === 2
        ? `${parts[0]}.${(parts[1] ?? "").slice(0, 2)}`
        : parts[0];
    setPrice(safe);
  }

  const save = useCallback(async () => {
    setError("");
    if (!dirty) return;

    // validate before hitting the server
    const priceCents = toCents(price);
    if (priceCents < 0) {
      setError("Price must be ≥ $0.00");
      return;
    }
    if (!label.trim()) {
      setError("Label cannot be empty");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/pricing/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim(),
        priceCents,
        sortOrder: p.sortOrder, // Keep existing sort order
        isActive,
      }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Saved");
      router.refresh(); // re-fetch server data
    } else {
      const j = await res.json().catch(() => null);
      const msg = j?.error ?? res.statusText ?? "Failed to save";
      setError(msg);
      toast.error("Save failed");
    }
  }, [dirty, label, price, isActive, p.id, p.sortOrder, router]);

  // ✅ Keyboard shortcut: depends on stable `save`
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // `save` already checks `dirty` internally
        void save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  return (
    <>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-300 transition-colors">
            <GripVertical size={16} />
          </div>
          <input
            className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Package name..."
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-gray-700/50 text-gray-300 border border-gray-600">
          {p.keyName}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">$</span>
          <input
            className="w-24 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-10 h-6 bg-gray-600 rounded-full transition-colors duration-200 ease-in-out ${
                isActive ? "bg-violet-600" : "bg-gray-600"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out transform ${
                  isActive ? "translate-x-5" : "translate-x-1"
                } mt-1`}
              />
            </div>
          </label>
          <span
            className={`text-sm font-medium ${
              isActive ? "text-green-400" : "text-gray-400"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={save}
            disabled={saving || !dirty}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              dirty
                ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-violet-500/25"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
            title={!dirty ? "No changes to save" : "Save changes (Ctrl+S)"}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              "Save"
            )}
          </button>
          {error && (
            <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-500/30">
              {error}
            </div>
          )}
        </div>
      </td>
    </>
  );
}
