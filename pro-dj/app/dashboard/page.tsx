import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  hasAdminPrivileges,
  canAccessDjFeatures,
  canAccessClientFeatures,
} from "@/lib/auth-utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  // Check user privileges
  const isAdmin = hasAdminPrivileges(session.user);
  const canAccessDj = canAccessDjFeatures(session.user);
  const canAccessClient = canAccessClientFeatures(session.user);

  // For admins, show a unified dashboard with all features
  if (isAdmin) {
    redirect("/dashboard/admin");
  }

  // For DJs, redirect to DJ dashboard
  if (canAccessDj && session.user.role === "DJ") {
    redirect("/dashboard/dj");
  }

  // For clients, redirect to client dashboard
  if (canAccessClient && session.user.role === "CLIENT") {
    redirect("/dashboard/client");
  }

  // Fallback to client dashboard
  redirect("/dashboard/client");
}
