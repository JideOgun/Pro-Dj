import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SuspensionNotice from "@/components/SuspensionNotice";
import { hasAdminPrivileges } from "@/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  // Allow users with any role (ADMIN, DJ, CLIENT) or admin privileges
  if (
    !session.user.role ||
    (!hasAdminPrivileges(session.user) &&
      session.user.role !== "DJ" &&
      session.user.role !== "CLIENT")
  ) {
    redirect("/auth");
  }

  return (
    <section>
      {session.user.status === "SUSPENDED" && (
        <SuspensionNotice
          suspensionReason={session.user.suspensionReason}
          suspendedAt={session.user.suspendedAt}
          suspendedBy={session.user.suspendedBy}
          currentUserId={session.user.id}
        />
      )}
      {children}
    </section>
  );
}
