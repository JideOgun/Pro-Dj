"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import SuspendedUserGuard from "@/components/SuspendedUserGuard";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  suspendedAt: Date | null;
  suspensionReason: string | null;
}

interface UserManagementActionsProps {
  user: User;
  currentAdminId: string;
}

export default function UserManagementActions({
  user,
  currentAdminId,
}: UserManagementActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [newRole, setNewRole] = useState(user.role);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleSuspendUser = async () => {
    if (!suspensionReason.trim()) {
      toast.error("Please provide a suspension reason");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: suspensionReason,
          adminId: currentAdminId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        let message = "User suspended successfully";

        // Add suspension details if available
        if (result.suspensionDetails) {
          const { affectedBookings, refundedBookings, notificationsSent } =
            result.suspensionDetails;
          message += `. ${affectedBookings} bookings affected, ${refundedBookings} refunded, ${notificationsSent} notifications sent.`;
        }

        toast.success(message);
        setShowSuspendModal(false);
        setSuspensionReason("");
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to suspend user");
      }
    } catch (error) {
      toast.error("Failed to suspend user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: currentAdminId }),
      });

      if (response.ok) {
        toast.success("User activated successfully");
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to activate user");
      }
    } catch (error) {
      toast.error("Failed to activate user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newRole,
          adminId: currentAdminId,
        }),
      });

      if (response.ok) {
        toast.success("User role updated successfully");
        setShowRoleModal(false);
        // Refresh the page to show updated role
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update user role");
      }
    } catch (error) {
      toast.error("Failed to update user role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type 'DELETE' to confirm account deletion");
      return;
    }

    if (!adminPassword.trim()) {
      toast.error("Please enter your password to confirm deletion");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentAdminId,
          adminPassword: adminPassword,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        let message = "User account deleted successfully";

        // Add termination details if available
        if (result.terminationDetails) {
          const { affectedBookings, refundedBookings, notificationsSent } =
            result.terminationDetails;
          message += `. ${affectedBookings} bookings affected, ${refundedBookings} refunded, ${notificationsSent} notifications sent.`;
        }

        toast.success(message);
        setShowDeleteModal(false);
        setDeleteConfirmation("");
        setAdminPassword("");
        // Redirect to users list since the user no longer exists
        window.location.href = "/dashboard/admin/users";
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete user account");
      }
    } catch (error) {
      toast.error("Failed to delete user account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>

      <SuspendedUserGuard
        fallback={
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">
              Admin actions are disabled while your account is suspended.
            </p>
          </div>
        }
      >
        <div className="grid md:grid-cols-3 gap-4">
          {/* Suspend/Activate User */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-300">Account Status</h3>
            {user.status === "ACTIVE" ? (
              <div>
                <button
                  onClick={() =>
                    user.id !== currentAdminId && setShowSuspendModal(true)
                  }
                  disabled={isLoading || user.id === currentAdminId}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    user.id === currentAdminId
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  }`}
                  title={
                    user.id === currentAdminId ? "Cannot suspend yourself" : ""
                  }
                >
                  {user.id === currentAdminId
                    ? "Cannot Suspend Self"
                    : "Suspend User"}
                </button>
                {user.id === currentAdminId && (
                  <p className="text-xs text-gray-400 mt-1">
                    Admins cannot suspend their own accounts
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleActivateUser}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Activate User
              </button>
            )}
          </div>

          {/* Change Role */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-300">User Role</h3>
            <button
              onClick={() => setShowRoleModal(true)}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Change Role
            </button>
          </div>

          {/* Delete Account */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-300">Danger Zone</h3>
            <button
              onClick={() =>
                user.id !== currentAdminId && setShowDeleteModal(true)
              }
              disabled={isLoading || user.id === currentAdminId}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                user.id === currentAdminId
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-red-800 hover:bg-red-900 disabled:opacity-50"
              }`}
              title={user.id === currentAdminId ? "Cannot delete yourself" : ""}
            >
              <Trash2 size={16} />
              {user.id === currentAdminId
                ? "Cannot Delete Self"
                : "Delete Account"}
            </button>
            {user.id === currentAdminId && (
              <p className="text-xs text-gray-400 mt-1">
                Admins cannot delete their own accounts
              </p>
            )}
          </div>
        </div>
      </SuspendedUserGuard>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Suspend User
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Are you sure you want to suspend {user.name || user.email}? This
              will prevent them from using the platform.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Suspension Reason
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspensionReason("");
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isLoading ? "Suspending..." : "Suspend User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Change User Role
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Change the role for {user.name || user.email}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CLIENT">Client</option>
                <option value="DJ">DJ</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeRole}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isLoading ? "Updating..." : "Update Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              Delete User Account
            </h3>
            <div className="mb-4">
              <p className="text-red-300 text-sm mb-3">
                <strong>This action cannot be undone!</strong> Deleting this
                account will:
              </p>
              <ul className="text-red-300 text-sm mb-4 space-y-1">
                <li>• Permanently remove all user data</li>
                <li>• Delete all associated bookings and reviews</li>
                <li>• Remove DJ profile (if applicable)</li>
                <li>• Cancel any pending payments</li>
              </ul>
              <p className="text-gray-300 text-sm mb-4">
                Are you absolutely sure you want to delete{" "}
                <span className="font-semibold text-white">
                  {user.name || user.email}
                </span>
                ?
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE to confirm..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter your password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter your admin password..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                  setAdminPassword("");
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={
                  isLoading ||
                  deleteConfirmation !== "DELETE" ||
                  !adminPassword.trim()
                }
                className="bg-red-800 hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
