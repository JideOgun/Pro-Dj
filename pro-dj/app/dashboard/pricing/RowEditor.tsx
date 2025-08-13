"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  id: string;
  label: string;
  keyName: string;
  priceCents: number;
  sortOrder: number;
  isActive: boolean;
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
  const [sortOrder, setSortOrder] = useState(p.sortOrder);
  const [isActive, setIsActive] = useState(p.isActive);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // dirty-state tracking
  const dirty = useMemo(() => {
    return (
      label.trim() !== p.label ||
      toCents(price) !== p.priceCents ||
      sortOrder !== p.sortOrder ||
      isActive !== p.isActive
    );
  }, [label, price, sortOrder, isActive, p]);

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
        sortOrder: Number.isFinite(sortOrder)
          ? Math.max(0, Math.floor(sortOrder))
          : 0,
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
  }, [dirty, label, price, sortOrder, isActive, p.id, router]);

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
    <tr
      className={`border-b border-dotted border-gray-800 ${
        dirty ? "bg-gray-900/40" : ""
      }`}
    >
      <td className="p-2">
        <input
          className="w-full bg-transparent border border-gray-800 rounded px-2 py-1 outline-none focus:border-violet-600"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
        />
      </td>
      <td className="p-2 opacity-80">{p.keyName}</td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          <span>$</span>
          <input
            className="w-28 bg-transparent border border-gray-800 rounded px-2 py-1 outline-none focus:border-violet-600"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
      </td>
      <td className="p-2">
        <input
          className="w-16 bg-transparent border border-gray-800 rounded px-2 py-1 outline-none focus:border-violet-600"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))}
          min={0}
        />
      </td>
      <td className="p-2">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="text-sm opacity-80">Active</span>
        </label>
      </td>
      <td className="p-2 text-right">
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="px-3 py-1 rounded bg-violet-600 hover:brightness-105 disabled:opacity-60"
          title={!dirty ? "No changes" : "Save changes"}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {error && <div className="text-sm text-red-400 mt-1">{error}</div>}
      </td>
    </tr>
  );
}
