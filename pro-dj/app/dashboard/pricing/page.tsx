import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import RowEditor from "./RowEditor";
import { redirect } from "next/navigation";

export default async function PricingPage() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    redirect("/auth");
  }

  const rows = await prisma.pricing.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      type: true,
      key: true,
      label: true,
      priceCents: true,
      isActive: true,
      sortOrder: true,
    },
  });

  // Group by type for a cleaner table
  const byType = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    (acc[r.type] ||= []).push(r);
    return acc;
  }, {});

  return (
    <main className="p-5 text-gray-200">
      <h1 className="text-2xl font-bold mb-4">Pricing</h1>
      {Object.entries(byType).map(([type, list]) => (
        <section key={type} className="mt-6">
          <h2 className="text-lg font-semibold opacity-85">{type}</h2>
          <table className="w-full border-collapse mt-2">
            <thead>
              <tr className="text-left border-b border-gray-800">
                <th className="p-2">Label</th>
                <th className="p-2">Key</th>
                <th className="p-2">Price</th>
                <th className="p-2">Sort</th>
                <th className="p-2">Active</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <RowEditor
                  key={r.id}
                  id={r.id}
                  label={r.label}
                  keyName={r.key}
                  priceCents={r.priceCents}
                  sortOrder={r.sortOrder}
                  isActive={r.isActive}
                />
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
