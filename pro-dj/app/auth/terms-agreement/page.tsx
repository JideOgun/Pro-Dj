"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import TermsAgreementModal from "@/components/TermsAgreementModal";
import DjContractorAgreementModal from "@/components/DjContractorAgreementModal";
import toast from "react-hot-toast";

export default function TermsAgreementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showDjModal, setShowDjModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<any>(null);

  // Prevent navigation away from terms agreement page
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      toast.error("You must agree to our terms before continuing");
      window.history.pushState(null, "", window.location.href);
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Push a state to prevent back navigation
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Check for pending registration data
  useEffect(() => {
    const stored = sessionStorage.getItem("pendingRegistration");
    const googleStored = sessionStorage.getItem("pendingGoogleRegistration");

    if (stored) {
      try {
        setPendingRegistration(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing stored registration data:", error);
        router.push("/auth");
      }
    } else if (googleStored) {
      try {
        setPendingRegistration(JSON.parse(googleStored));
      } catch (error) {
        console.error("Error parsing stored Google registration data:", error);
        router.push("/auth");
      }
    } else if (status === "unauthenticated") {
      // No pending registration and not authenticated, redirect to auth
      router.push("/auth");
    }
  }, [status, router]);

  // Show appropriate modal based on user role
  useEffect(() => {
    if (pendingRegistration) {
      if (pendingRegistration.role === "DJ") {
        setShowDjModal(true);
      } else {
        setShowModal(true);
      }
    }
  }, [pendingRegistration]);

  // Handle regular terms agreement completion
  const handleAgree = async () => {
    if (!pendingRegistration) {
      toast.error("No registration data found");
      return;
    }

    setIsLoading(true);
    try {
      // Check if this is Google OAuth registration or regular registration
      const isGoogleRegistration = !pendingRegistration.password;

      if (isGoogleRegistration) {
        // Handle Google OAuth registration - just update the role
        const res = await fetch("/api/auth/update-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: pendingRegistration.role }),
        });

        if (res.ok) {
          // Clear stored registration data
          sessionStorage.removeItem("pendingGoogleRegistration");

          setShowModal(false);
          setIsRedirecting(true);
          toast.success("Account setup completed!");

          // Redirect based on user role
          setTimeout(() => {
            if (pendingRegistration.role === "DJ") {
              router.push("/dj/register");
            } else {
              router.push("/dashboard/profile");
            }
          }, 1000);
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to update role");
          setIsLoading(false);
        }
      } else {
        // Handle regular registration - create the user account with terms agreement
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pendingRegistration.name,
            email: pendingRegistration.email,
            password: pendingRegistration.password,
            role: pendingRegistration.role,
            agreedToTerms: true,
            agreedToPrivacy: true,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          // Clear stored registration data
          sessionStorage.removeItem("pendingRegistration");

          // Auto-login after registration
          const loginRes = await signIn("credentials", {
            email: pendingRegistration.email,
            password: pendingRegistration.password,
            redirect: false,
          });

          if (loginRes?.error) {
            toast.error(
              "Account created but login failed. Please try logging in."
            );
            setIsLoading(false);
            return;
          }

          setShowModal(false);
          setIsRedirecting(true);
          toast.success("Account created successfully!");

          // Redirect based on user role
          setTimeout(() => {
            if (pendingRegistration.role === "DJ") {
              router.push("/dj/register");
            } else {
              router.push("/dashboard/profile");
            }
          }, 1000);
        } else {
          toast.error(data.error || "Registration failed");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    // Clear stored registration data
    sessionStorage.removeItem("pendingRegistration");
    sessionStorage.removeItem("pendingGoogleRegistration");
    toast.error("You must agree to our terms to use the platform");
    router.push("/auth");
  };

  // Handle DJ contractor agreement completion
  const handleDjAgree = async (taxInfo: any) => {
    if (!pendingRegistration) {
      toast.error("No registration data found");
      return;
    }

    setIsLoading(true);
    try {
      // Check if this is Google OAuth registration or regular registration
      const isGoogleRegistration = !pendingRegistration.password;

      if (isGoogleRegistration) {
        // Handle Google OAuth registration with contractor terms
        const res = await fetch("/api/auth/update-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: pendingRegistration.role,
            contractorTerms: true,
            businessType: taxInfo.isSoleProprietor
              ? "SOLE_PROPRIETOR"
              : "CORPORATION",
          }),
        });

        if (res.ok) {
          // Clear stored registration data
          sessionStorage.removeItem("pendingGoogleRegistration");

          setShowDjModal(false);
          setIsRedirecting(true);
          toast.success("DJ account setup completed!");

          // Redirect to DJ registration
          setTimeout(() => {
            router.push("/dj/register");
          }, 1000);
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to update role");
          setIsLoading(false);
        }
      } else {
        // Handle regular DJ registration with contractor terms
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pendingRegistration.name,
            email: pendingRegistration.email,
            password: pendingRegistration.password,
            role: pendingRegistration.role,
            agreedToTerms: true,
            agreedToPrivacy: true,
            contractorTerms: true,
            businessType: taxInfo.isSoleProprietor
              ? "SOLE_PROPRIETOR"
              : "CORPORATION",
          }),
        });

        const data = await res.json();

        if (res.ok) {
          // Clear stored registration data
          sessionStorage.removeItem("pendingRegistration");

          // Auto-login after registration
          const loginRes = await signIn("credentials", {
            email: pendingRegistration.email,
            password: pendingRegistration.password,
            redirect: false,
          });

          if (loginRes?.error) {
            toast.error(
              "Account created but login failed. Please try logging in."
            );
            setIsLoading(false);
            return;
          }

          setShowDjModal(false);
          setIsRedirecting(true);
          toast.success("DJ account created successfully!");

          // Redirect to DJ registration
          setTimeout(() => {
            router.push("/dj/register");
          }, 1000);
        } else {
          toast.error(data.error || "Registration failed");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // Show loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 mx-auto bg-gray-700 rounded-lg animate-pulse"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 mx-auto bg-green-600 rounded-lg animate-pulse"></div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Pro-DJ!</h2>
          <p className="text-gray-300">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // If no pending registration and user is authenticated, they've already completed the flow
  if (!pendingRegistration && status === "authenticated") {
    if (session?.user?.role === "DJ") {
      router.push("/dj/register");
    } else {
      router.push("/dashboard/profile");
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-gray-800 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to Pro-DJ!</h1>
          <p className="text-gray-300 text-lg mb-6">
            Before you can start using our platform, please review and agree to
            our Terms of Service and Privacy Policy.
          </p>

          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            Review Terms & Privacy Policy
          </button>
        </div>
      </div>

      {/* Terms Agreement Modal */}
      <TermsAgreementModal
        isOpen={showModal}
        onAgree={handleAgree}
        onDecline={handleDecline}
        isLoading={isLoading}
      />

      {/* DJ Contractor Agreement Modal */}
      <DjContractorAgreementModal
        isOpen={showDjModal}
        onAgree={handleDjAgree}
        onDecline={handleDecline}
        isLoading={isLoading}
      />
    </div>
  );
}
