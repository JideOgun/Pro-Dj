"use client";

import { useTermsAgreement } from "@/hooks/useTermsAgreement";
import TermsAgreementModal from "./TermsAgreementModal";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface TermsAgreementWrapperProps {
  children: React.ReactNode;
  requireAgreement?: boolean; // Set to false for pages that don't require agreement
}

export default function TermsAgreementWrapper({
  children,
  requireAgreement = true,
}: TermsAgreementWrapperProps) {
  const {
    agreementStatus,
    isLoading,
    isSubmitting,
    hasAgreedToAll,
    needsAgreement,
    submitAgreement,
  } = useTermsAgreement();

  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);

  // Pages that don't require terms agreement
  const excludedPaths = [
    "/",
    "/auth",
    "/legal",
    "/test-terms",
    "/auth/terms-agreement",
    "/dashboard/profile",
    "/dashboard/account",
  ];

  // Check if current path should require agreement
  const shouldRequireAgreement =
    requireAgreement &&
    !excludedPaths.some((path) => pathname.startsWith(path));

  // Show modal if user needs to agree to terms
  useEffect(() => {
    if (!isLoading && shouldRequireAgreement && needsAgreement) {
      setShowModal(true);
    }
  }, [isLoading, shouldRequireAgreement, needsAgreement]);

  const handleAgree = async () => {
    const success = await submitAgreement();
    if (success) {
      setShowModal(false);
      // Optionally redirect or refresh the page
      window.location.reload();
    }
  };

  const handleDecline = () => {
    // Redirect to home page or show message
    router.push("/");
  };

  // Show loading state while checking agreement status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 mx-auto bg-gray-700 rounded-lg animate-pulse"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If agreement is not required or user has already agreed, show children
  if (!shouldRequireAgreement || hasAgreedToAll) {
    return <>{children}</>;
  }

  // Show terms agreement modal
  return (
    <>
      <TermsAgreementModal
        isOpen={showModal}
        onAgree={handleAgree}
        onDecline={handleDecline}
        isLoading={isSubmitting}
      />

      {/* Show a blocking overlay while modal is open */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 mb-4 mx-auto bg-gray-700 rounded-lg animate-pulse"></div>
              <p className="text-gray-300">
                Please review and agree to our terms...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
