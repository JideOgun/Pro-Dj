import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SuspensionNotice from "@/components/SuspensionNotice";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  const role = session.user.role;

  // Allow ADMIN, DJ, and CLIENT users
  if (!role || (role !== "ADMIN" && role !== "DJ" && role !== "CLIENT")) {
    redirect("/auth");
  }

  return (
    <section>
      {session.user.status === "SUSPENDED" && (
        <SuspensionNotice
          suspensionReason={session.user.suspensionReason}
          suspendedAt={session.user.suspendedAt}
        />
      )}
      {children}
    </section>
  );
}
