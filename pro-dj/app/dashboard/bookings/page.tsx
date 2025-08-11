import { prisma } from "@/lib/prisma";

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <main style={{ padding: "1.25rem" }}>
      <h1>Bookings {bookings.length}</h1>
      <ul style={{ marginTop: ".75rem", display: "grid", gap: ".5rem" }}>
        {bookings.map((booking) => {
          return (
            <li key={booking.id} style={{ border: "1px solid #1b1d21", borderRadius: 8, padding: ".6rem .8rem" }}>
              <div>
                <strong>{booking.eventType}</strong> - {new Date(booking.eventDate).toLocaleDateString()}
                <div style={{ opacity: .75 }}>{booking.user?.name ?? "Unknown"}  - {booking.user?.email?? "No email exists"}</div>
                <div style={{ opacity: .75 }}>{booking.message}</div>
                <div style={{ opacity: .75 }}>Paid: {booking.isPaid ? "Yes" : "No"}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
