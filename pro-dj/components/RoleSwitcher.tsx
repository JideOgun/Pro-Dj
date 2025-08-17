"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function RoleSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleSwitch = async (newRole: string) => {
    if (isSwitching) return;

    setIsSwitching(true);

    try {
      const response = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole }),
      });

      const result = await response.json();

      if (result.ok) {
        // Update the session with new role
        await update({ role: newRole });

        toast.success(`Switched to ${newRole} role`);

        // Redirect based on new role
        switch (newRole) {
          case "ADMIN":
            router.push("/dashboard/admin");
            break;
          case "DJ":
            router.push("/dashboard/dj");
            break;
          case "CLIENT":
            router.push("/dashboard/client");
            break;
        }
      } else {
        toast.error(result.error || "Failed to switch role");
      }
    } catch (error) {
      console.error("Role switch error:", error);
      toast.error("Failed to switch role");
    } finally {
      setIsSwitching(false);
    }
  };

  if (!session?.user) return null;

  // Only show role switcher for users with admin access
  const hasAdminAccess =
    session.user.role === "ADMIN" ||
    session.user.email === "jideogun93@gmail.com";

  if (!hasAdminAccess) return null;

  const currentRole = session.user.role;
  const availableRoles = ["ADMIN", "DJ", "CLIENT"].filter(
    (role) => role !== currentRole
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-3">
        Switch Role (Current: {currentRole})
      </h3>
      <div className="flex gap-2">
        {availableRoles.map((role) => (
          <button
            key={role}
            onClick={() => handleRoleSwitch(role)}
            disabled={isSwitching}
            className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-sm text-white transition-colors"
          >
            {isSwitching ? "Switching..." : `Switch to ${role}`}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Switch between roles to access different dashboards and features.
      </p>
    </div>
  );
}
