"use client";

import { useState } from "react";
import {
  Pause,
  Play,
  Trash2,
  AlertTriangle,
  Shield,
  X,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

interface PauseAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPause: (password: string) => Promise<void>;
  isLoading?: boolean;
  userRole?: string;
}

export function PauseAccountModal({
  isOpen,
  onClose,
  onPause,
  isLoading = false,
  userRole,
}: PauseAccountModalProps) {
  const [password, setPassword] = useState("");
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handlePause = async () => {
    if (!hasConfirmed) {
      toast.error("Please enter your password");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    try {
      await onPause(password);
      onClose();
    } catch (error) {
      console.error("Error pausing account:", error);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setHasConfirmed(text.trim().length > 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Pause className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Pause Account
              </h3>
              <p className="text-gray-400 text-sm">
                Temporarily disable your account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-yellow-300 font-medium mb-2">
                  What happens when you pause your account:
                </h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Your profile will be hidden from searches</li>
                  <li>
                    • You won&apos;t be able to{" "}
                    {userRole === "DJ" ? "receive" : "make"} new bookings
                  </li>
                  <li>• Existing bookings will remain active</li>
                  <li>• You can reactivate anytime</li>
                  <li>• All your data is preserved</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter your password to confirm:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePause}
            disabled={!hasConfirmed || isLoading}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Pausing...
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pause Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReactivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReactivate: () => Promise<void>;
  isLoading?: boolean;
  userRole?: string;
}

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (password: string) => Promise<void>;
  isLoading?: boolean;
}

export function ReactivateAccountModal({
  isOpen,
  onClose,
  onReactivate,
  isLoading = false,
  userRole,
}: ReactivateAccountModalProps) {
  const handleReactivate = async () => {
    try {
      await onReactivate();
      onClose();
    } catch (error) {
      console.error("Error reactivating account:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Reactivate Account
              </h3>
              <p className="text-gray-400 text-sm">
                Resume your account activity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-green-300 font-medium mb-2">
                  What happens when you reactivate your account:
                </h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Your profile will be visible in searches again</li>
                  <li>
                    • You will be able to{" "}
                    {userRole === "DJ" ? "receive" : "make"} new bookings
                  </li>
                  <li>• All your existing data will be preserved</li>
                  <li>• You can pause your account again anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReactivate}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Reactivating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Reactivate Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onDelete,
  isLoading = false,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState("");
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [finalConfirmation, setFinalConfirmation] = useState(false);

  const handleDelete = async () => {
    if (!hasConfirmed || !finalConfirmation) {
      toast.error("Please complete all confirmation steps");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    try {
      await onDelete(password);
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setHasConfirmed(text.trim().length > 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Delete Account
              </h3>
              <p className="text-gray-400 text-sm">
                Permanently remove your account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-300 font-medium mb-2">
                  ⚠️ This action is irreversible:
                </h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• All your data will be permanently deleted</li>
                  <li>• Your profile, bookings, and history will be removed</li>
                  <li>• This action cannot be undone</li>
                  <li>• Consider pausing your account instead</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Step 1: Enter your password to confirm:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {hasConfirmed && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={finalConfirmation}
                  onChange={(e) => setFinalConfirmation(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2 disabled:opacity-50"
                />
                <span className="text-gray-300 text-sm">
                  I understand this action is permanent and cannot be undone
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!hasConfirmed || !finalConfirmation || isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
