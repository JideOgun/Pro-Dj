import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import Actions from "./row-actions"; // client component below

export default async function BookingsPage() {
  const gate = await requireAdmin();
  if (!gate.ok) return <main className="p-5">Forbidden</main>;

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <main className="p-5 text-gray-200">
      <h1 className="text-2xl font-semibold mb-4">Bookings</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left border-b border-gray-800">
            <th className="p-2">When</th>
            <th className="p-2">Type</th>
            <th className="p-2">Package</th>
            <th className="p-2">Client</th>
            <th className="p-2">Quote</th>
            <th className="p-2">Status</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id} className="border-b border-gray-800/70">
              <td className="p-2">{b.eventDate.toISOString().slice(0,10)}</td>
              <td className="p-2">{b.eventType}</td>
              <td className="p-2">{b.packageKey ?? "-"}</td>
              <td className="p-2">{b.user?.email ?? "-"}</td>
              <td className="p-2">{b.quotedPriceCents ? `$${(b.quotedPriceCents/100).toFixed(2)}` : "-"}</td>
              <td className="p-2">
                <span className={
                  "px-2 py-1 rounded text-xs " +
                  (b.status === "PENDING" ? "bg-yellow-900/40" :
                   b.status === "ACCEPTED" ? "bg-blue-900/40" :
                   b.status === "CONFIRMED" ? "bg-green-900/40" :
                   b.status === "DECLINED" ? "bg-red-900/40" : "bg-gray-800")
                }>
                  {b.status}
                </span>
              </td>
              <td className="p-2 text-right">
                <Actions
                  id={b.id}
                  status={b.status}
                  checkoutSessionId={b.checkoutSessionId}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
