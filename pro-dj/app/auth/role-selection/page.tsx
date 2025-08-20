"use client";

import { useState, useEffect } from "react";
import { useSession, update } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Music, Users, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function RoleSelectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"CLIENT" | "DJ" | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const handleRoleSelection = async (role: "CLIENT" | "DJ") => {
    if (!session?.user) return;

    setIsSubmitting(true);
    try {
      // Store the selected role in sessionStorage for terms agreement
      sessionStorage.setItem(
        "pendingGoogleRegistration",
        JSON.stringify({
          role,
          email: session.user.email,
          name: session.user.name,
        })
      );

      // Redirect to terms agreement page
      router.push("/auth/terms-agreement");
    } catch (error) {
      toast.error("Something went wrong");
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-800 rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Music className="w-16 h-16 mb-4 mx-auto text-violet-400" />
            <h1 className="text-3xl font-bold mb-2">Welcome to Pro-DJ!</h1>
            <p className="text-gray-300 text-lg">
              Hi {session.user.name || session.user.email}, let's get you set up
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-center mb-6">
              I am signing up as:
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Client Option */}
              <button
                onClick={() => setSelectedRole("CLIENT")}
                disabled={isSubmitting}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedRole === "CLIENT"
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center mb-4">
                  <Users className="w-8 h-8 mr-3" />
                  <div>
                    <div className="text-xl font-semibold">Client</div>
                    <div className="text-sm text-gray-400">
                      I want to book DJs
                    </div>
                  </div>
                </div>
                <ul className="text-sm space-y-2 text-gray-300">
                  <li>• Browse and book DJs for events</li>
                  <li>• Search by location, genre, and price</li>
                  <li>• Manage your bookings and events</li>
                  <li>• Get quotes and communicate with DJs</li>
                </ul>
              </button>

              {/* DJ Option */}
              <button
                onClick={() => setSelectedRole("DJ")}
                disabled={isSubmitting}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedRole === "DJ"
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center mb-4">
                  <Music className="w-8 h-8 mr-3" />
                  <div>
                    <div className="text-xl font-semibold">DJ</div>
                    <div className="text-sm text-gray-400">
                      I am a DJ looking for gigs
                    </div>
                  </div>
                </div>
                <ul className="text-sm space-y-2 text-gray-300">
                  <li>• Create your professional DJ profile</li>
                  <li>• Upload mixes, photos, and set pricing</li>
                  <li>• Receive booking requests from clients</li>
                  <li>• Manage your calendar and availability</li>
                </ul>
              </button>
            </div>
          </div>

          {/* Continue Button */}
          {selectedRole && (
            <div className="text-center">
              <button
                onClick={() => handleRoleSelection(selectedRole)}
                disabled={isSubmitting}
                className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center mx-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    Continue as {selectedRole === "DJ" ? "DJ" : "Client"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-300 text-center">
              Don't worry, you can always update your role later in your profile
              settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
