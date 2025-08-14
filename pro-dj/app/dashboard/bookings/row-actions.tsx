"use client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Actions({
  id,
  status,
  checkoutSessionId,
}: {
  id: string;
  status: string;
  checkoutSessionId?: string | null;
}) {
  const router = useRouter();

  async function run(kind: "accept" | "decline" | "mark-paid") {
    const res = await fetch(`/api/bookings/${id}/${kind}`, { method: "PATCH" });
    const j = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(j?.error ?? `Failed to ${kind}`);
      return;
    }
    if (kind === "accept") toast.success("Accepted — payment link sent");
    if (kind === "decline") toast("Declined");
    if (kind === "mark-paid") toast.success("Marked as paid");
    router.refresh();
  }

  async function copyLink() {
    const res = await fetch(`/api/bookings/${id}/accept`, { method: "PATCH" });
    const j = await res.json().catch(() => null);
    if (res.ok && j?.checkoutUrl) {
      await navigator.clipboard.writeText(j.checkoutUrl);
      toast.success("Payment link copied!");
      router.refresh();
    } else {
      toast.error(j?.error ?? "Could not get payment link");
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      {status === "PENDING" && (
        <>
          <button
            onClick={() => run("accept")}
            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => run("decline")}
            className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
          >
            Decline
          </button>
        </>
      )}
      {status === "ACCEPTED" && (
        <>
          <button
            onClick={copyLink}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Copy Payment Link
          </button>
          {/* Temporary admin control until webhooks */}
          <button
            onClick={() => run("mark-paid")}
            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
          >
            Mark Paid (temp)
          </button>
        </>
      )}
      {status === "CONFIRMED" && (
        <span className="px-3 py-1.5 rounded-lg bg-green-700/50 text-green-200 text-sm font-medium">
          Paid
        </span>
      )}
    </div>
  );
}
