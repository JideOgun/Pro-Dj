"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Pause,
  Play,
  Trash2,
  AlertTriangle,
  Shield,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import {
  PauseAccountModal,
  ReactivateAccountModal,
  DeleteAccountModal,
} from "@/components/AccountManagementModals";
import toast from "react-hot-toast";

export default function AccountManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load account status on component mount
  useEffect(() => {
    if (session?.user?.email) {
      loadAccountStatus();
    }
  }, [session]);

  const loadAccountStatus = async () => {
    try {
      const response = await fetch("/api/user/account");
      const data = await response.json();

      if (response.ok) {
        setAccountStatus(data);
      }
    } catch (error) {
      console.error("Error loading account status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseAccount = async (password: string) => {
    setIsAccountLoading(true);
    try {
      const response = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause", password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account paused successfully");
        await loadAccountStatus();
      } else {
        toast.error(data.error || "Failed to pause account");
      }
    } catch (error) {
      console.error("Error pausing account:", error);
      toast.error("Failed to pause account");
    } finally {
      setIsAccountLoading(false);
    }
  };

  const handleReactivateAccount = async () => {
    setIsAccountLoading(true);
    try {
      const response = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account reactivated successfully");
        await loadAccountStatus();
      } else {
        toast.error(data.error || "Failed to reactivate account");
      }
    } catch (error) {
      console.error("Error reactivating account:", error);
      toast.error("Failed to reactivate account");
    } finally {
      setIsAccountLoading(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    setIsAccountLoading(true);
    try {
      // First delete the account while user is still authenticated
      const response = await fetch("/api/user/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account deleted successfully");
        // Then sign out and redirect to homepage
        await signOut({
          callbackUrl: "/",
          redirect: true,
        });
      } else {
        toast.error(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsAccountLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 mx-auto bg-gray-700 rounded-lg animate-pulse"></div>
          <p className="text-gray-300">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Account Management
              </h1>
              <p className="text-gray-400">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Status Card */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-violet-400" />
                <h2 className="text-xl font-semibold text-white">
                  Account Status
                </h2>
              </div>

              {accountStatus && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">
                        Current Status
                      </h3>
                      <p className="text-xs text-gray-400">
                        {accountStatus.user?.status === "SUSPENDED"
                          ? "Your account is currently paused"
                          : "Your account is active and visible"}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        accountStatus.user?.status === "SUSPENDED"
                          ? "bg-yellow-600/30 text-yellow-300 border border-yellow-500/30"
                          : "bg-green-600/30 text-green-300 border border-green-500/30"
                      }`}
                    >
                      {accountStatus.user?.status === "SUSPENDED"
                        ? "Paused"
                        : "Active"}
                    </div>
                  </div>

                  {accountStatus.activeBookingsCount > 0 && (
                    <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-blue-300 font-medium mb-1">
                            Active Bookings
                          </h4>
                          <p className="text-sm text-blue-200">
                            You have {accountStatus.activeBookingsCount} active
                            booking(s). Please complete or cancel them before
                            deleting your account.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-violet-400" />
                <h2 className="text-xl font-semibold text-white">
                  Account Actions
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Pause/Reactivate Account */}
                <button
                  onClick={() =>
                    accountStatus?.user?.status === "SUSPENDED"
                      ? setShowReactivateModal(true)
                      : setShowPauseModal(true)
                  }
                  disabled={isAccountLoading}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 text-left h-full ${
                    accountStatus?.user?.status === "SUSPENDED"
                      ? "border-green-500 bg-green-500/10 text-green-300 hover:border-green-400"
                      : "border-yellow-500 bg-yellow-500/10 text-yellow-300 hover:border-yellow-400"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {accountStatus?.user?.status === "SUSPENDED" ? (
                      <Play className="w-5 h-5" />
                    ) : (
                      <Pause className="w-5 h-5" />
                    )}
                    <span className="font-semibold">
                      {accountStatus?.user?.status === "SUSPENDED"
                        ? "Reactivate Account"
                        : "Pause Account"}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">
                    {accountStatus?.user?.status === "SUSPENDED"
                      ? session?.user?.role === "DJ"
                        ? "Resume your account and start receiving bookings again"
                        : "Resume your account and start making bookings again"
                      : session?.user?.role === "DJ"
                      ? "Temporarily hide your profile and stop receiving new bookings"
                      : "Temporarily hide your profile and stop making new bookings"}
                  </p>
                </button>

                {/* Delete Account */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={
                    isAccountLoading || accountStatus?.activeBookingsCount > 0
                  }
                  className="p-6 rounded-lg border-2 border-red-500 bg-red-500/10 text-red-300 hover:border-red-400 transition-all duration-200 text-left h-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Trash2 className="w-5 h-5" />
                    <span className="font-semibold">Delete Account</span>
                  </div>
                  <p className="text-sm opacity-80">
                    Permanently remove your account and all associated data
                  </p>
                  {accountStatus?.activeBookingsCount > 0 && (
                    <p className="text-xs text-red-400 mt-2">
                      Complete active bookings first
                    </p>
                  )}
                </button>
              </div>
            </div>

            {/* Warning Section */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-red-300 font-semibold mb-3">
                    Important Information
                  </h3>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>
                        Pausing your account will hide your profile from
                        searches and prevent{" "}
                        {session?.user?.role === "DJ" ? "receiving" : "making"}{" "}
                        new bookings
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>
                        Deleting your account is permanent and cannot be undone
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>
                        All your data, bookings, and history will be permanently
                        removed
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>
                        Consider pausing your account instead of deleting it if
                        you plan to return
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/dashboard/profile")}
                  className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-3"
                >
                  <User className="w-4 h-4" />
                  Edit Profile
                </button>
                <button
                  onClick={() => router.push("/dashboard/bookings")}
                  className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-3"
                >
                  <Settings className="w-4 h-4" />
                  View Bookings
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  Back to Home
                </button>
              </div>
            </div>

            {/* Account Info */}
            {session?.user && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Account Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white">{session.user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Role:</span>
                    <p className="text-white capitalize">
                      {session.user.role?.toLowerCase()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Member Since:</span>
                    <p className="text-white">
                      {session.user.createdAt
                        ? new Date(session.user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Management Modals */}
      <PauseAccountModal
        isOpen={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        onPause={handlePauseAccount}
        isLoading={isAccountLoading}
        userRole={session?.user?.role}
      />

      <ReactivateAccountModal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        onReactivate={handleReactivateAccount}
        isLoading={isAccountLoading}
        userRole={session?.user?.role}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteAccount}
        isLoading={isAccountLoading}
      />
    </div>
  );
}
