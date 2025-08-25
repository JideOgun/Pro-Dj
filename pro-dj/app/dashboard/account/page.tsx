import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Management</h1>
          <p className="text-gray-400">
            Manage your account settings and security preferences
          </p>
        </div>

        {/* Account Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Name
              </label>
              <p className="text-white">{session.user.name || "Not provided"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <p className="text-white">{session.user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Role
              </label>
              <p className="text-white capitalize">{session.user.role?.toLowerCase()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Account Status
              </label>
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChangePasswordForm />
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Security Tips</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                Use a strong password with at least 8 characters
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                Include a mix of letters, numbers, and symbols
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                Never share your password with anyone
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                Change your password regularly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                Use different passwords for different accounts
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
