import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = session.user.role;

  // Redirect clients to their dashboard
  if (role === "CLIENT") {
    redirect("/dashboard/client");
  }

  // Redirect DJs to their dashboard
  if (role === "DJ") {
    redirect("/dashboard/dj");
  }

  // For ADMIN users, redirect to admin dashboard
  redirect("/dashboard/admin");
}
