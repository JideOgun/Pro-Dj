import { Role } from "@/app/generated/prisma";

// Check if user has admin privileges (admin role or specific admin email)
export function hasAdminPrivileges(user: {
  email?: string | null;
  role?: Role;
}) {
  if (!user) return false;

  // Check if user is admin by role
  if (user.role === "ADMIN") return true;

  // Check if user is admin by email (from .env)
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (adminEmail && user.email?.toLowerCase() === adminEmail) return true;

  return false;
}

// Check if user can access DJ features (DJ role or admin)
export function canAccessDjFeatures(user: {
  email?: string | null;
  role?: Role;
}) {
  if (!user) return false;

  // Admins can access everything
  if (hasAdminPrivileges(user)) return true;

  // DJs can access DJ features
  if (user.role === "DJ") return true;

  return false;
}

// Check if user can access client features (CLIENT role or admin)
export function canAccessClientFeatures(user: {
  email?: string | null;
  role?: Role;
}) {
  if (!user) return false;

  // Admins can access everything
  if (hasAdminPrivileges(user)) return true;

  // Clients can access client features
  if (user.role === "CLIENT") return true;

  return false;
}

// Get user's effective role for display purposes
export function getEffectiveRole(user: { email?: string | null; role?: Role }) {
  if (hasAdminPrivileges(user)) {
    return "ADMIN";
  }
  return user.role || "CLIENT";
}
