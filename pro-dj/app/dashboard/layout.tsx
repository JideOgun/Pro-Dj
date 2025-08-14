import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

  return <section>{children}</section>;
}
