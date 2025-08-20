"use client";

import { useState } from "react";
import {
  Check,
  X,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TermsAgreementModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export default function TermsAgreementModal({
  isOpen,
  onAgree,
  onDecline,
  isLoading = false,
}: TermsAgreementModalProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [hasAgreedToPrivacy, setHasAgreedToPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const canProceed =
    hasReadTerms && hasReadPrivacy && hasAgreedToTerms && hasAgreedToPrivacy;

  const handleAgree = () => {
    if (canProceed) {
      onAgree();
    }
  };

  const handleDecline = () => {
    onDecline();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Terms & Privacy Agreement
              </h2>
              <p className="text-gray-400 text-sm">
                Please review and agree to continue
              </p>
            </div>
          </div>
          <button
            onClick={handleDecline}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              Before you can create your account, you must read and agree to our
              Terms of Service and Privacy Policy. These documents outline how
              we protect your data and the terms governing your use of our
              platform.
            </p>
          </div>

          {/* Terms of Service Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-medium text-white">
                  Terms of Service
                </h3>
              </div>
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm transition-colors"
              >
                <span>{showTerms ? "Hide" : "Read"} Terms of Service</span>
                {showTerms ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="bg-gray-700/30 rounded-lg border border-gray-600/30 overflow-hidden">
              {showTerms && (
                <div className="p-4 border-b border-gray-600/30 max-h-60 overflow-y-auto">
                  <div className="text-gray-300 text-sm space-y-3">
                    <h4 className="font-semibold text-white">
                      Pro-DJ Terms of Service
                    </h4>
                    <p>
                      <strong>1. Acceptance of Terms</strong>
                      <br />
                      By accessing and using the Pro-DJ platform, you accept and
                      agree to be bound by the terms and provision of this
                      agreement.
                    </p>
                    <p>
                      <strong>2. User Responsibilities</strong>
                      <br />
                      You are responsible for maintaining the confidentiality of
                      your account and for all activities that occur under your
                      account.
                    </p>
                    <p>
                      <strong>3. Booking and Payment</strong>
                      <br />
                      All bookings are subject to availability and confirmation.
                      Payment terms are as specified in individual booking
                      agreements.
                    </p>
                    <p>
                      <strong>4. Cancellation Policy</strong>
                      <br />
                      Cancellation policies vary by DJ and event type. Please
                      review specific cancellation terms before booking.
                    </p>
                    <p>
                      <strong>5. Service Quality</strong>
                      <br />
                      While we strive to ensure quality service, we cannot
                      guarantee specific outcomes and are not liable for
                      service-related disputes.
                    </p>
                    <p>
                      <strong>6. Prohibited Activities</strong>
                      <br />
                      Users may not engage in illegal activities, harassment, or
                      any behavior that violates platform policies.
                    </p>
                    <p>
                      <strong>7. Termination</strong>
                      <br />
                      We reserve the right to terminate or suspend accounts that
                      violate these terms or engage in inappropriate behavior.
                    </p>
                    <p>
                      <strong>8. Changes to Terms</strong>
                      <br />
                      We may modify these terms at any time. Continued use of
                      the platform constitutes acceptance of updated terms.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-300 text-sm">
                    Our Terms of Service govern your use of the Pro-DJ platform,
                    including booking policies, payment terms, and user
                    responsibilities.
                  </p>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasReadTerms}
                        onChange={(e) => setHasReadTerms(e.target.checked)}
                        disabled={isLoading}
                        className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 focus:ring-2"
                      />
                      <span className="text-gray-300 text-sm">I have read</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasAgreedToTerms}
                        onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                        disabled={isLoading || !hasReadTerms}
                        className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 focus:ring-2 disabled:opacity-50"
                      />
                      <span className="text-gray-300 text-sm">I agree</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Policy Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-medium text-white">
                  Privacy Policy
                </h3>
              </div>
              <button
                onClick={() => setShowPrivacy(!showPrivacy)}
                className="flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm transition-colors"
              >
                <span>{showPrivacy ? "Hide" : "Read"} Privacy Policy</span>
                {showPrivacy ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="bg-gray-700/30 rounded-lg border border-gray-600/30 overflow-hidden">
              {showPrivacy && (
                <div className="p-4 border-b border-gray-600/30 max-h-60 overflow-y-auto">
                  <div className="text-gray-300 text-sm space-y-3">
                    <h4 className="font-semibold text-white">
                      Pro-DJ Privacy Policy
                    </h4>
                    <p>
                      <strong>1. Information We Collect</strong>
                      <br />
                      We collect information you provide directly to us, such as
                      when you create an account, make a booking, or contact us
                      for support.
                    </p>
                    <p>
                      <strong>2. How We Use Your Information</strong>
                      <br />
                      We use the information we collect to provide, maintain,
                      and improve our services, process transactions, and
                      communicate with you.
                    </p>
                    <p>
                      <strong>3. Information Sharing</strong>
                      <br />
                      We do not sell, trade, or otherwise transfer your personal
                      information to third parties without your consent, except
                      as described in this policy.
                    </p>
                    <p>
                      <strong>4. Data Security</strong>
                      <br />
                      We implement appropriate security measures to protect your
                      personal information against unauthorized access,
                      alteration, disclosure, or destruction.
                    </p>
                    <p>
                      <strong>5. Your Rights</strong>
                      <br />
                      You have the right to access, correct, or delete your
                      personal information. You can also withdraw consent for
                      data processing at any time.
                    </p>
                    <p>
                      <strong>6. Cookies and Tracking</strong>
                      <br />
                      We use cookies and similar technologies to enhance your
                      experience and analyze how our services are used.
                    </p>
                    <p>
                      <strong>7. Third-Party Services</strong>
                      <br />
                      Our services may integrate with third-party services.
                      These services have their own privacy policies that govern
                      their use of your information.
                    </p>
                    <p>
                      <strong>8. Changes to This Policy</strong>
                      <br />
                      We may update this privacy policy from time to time. We
                      will notify you of any material changes by posting the new
                      policy on our platform.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-300 text-sm">
                    Our Privacy Policy explains how we collect, use, and protect
                    your personal information in compliance with GDPR and other
                    privacy regulations.
                  </p>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasReadPrivacy}
                        onChange={(e) => setHasReadPrivacy(e.target.checked)}
                        disabled={isLoading}
                        className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 focus:ring-2"
                      />
                      <span className="text-gray-300 text-sm">I have read</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasAgreedToPrivacy}
                        onChange={(e) =>
                          setHasAgreedToPrivacy(e.target.checked)
                        }
                        disabled={isLoading || !hasReadPrivacy}
                        className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 focus:ring-2 disabled:opacity-50"
                      />
                      <span className="text-gray-300 text-sm">I agree</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">
              Important Information
            </h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>
                • You can withdraw your consent at any time by contacting us
              </li>
              <li>
                • We may update these documents and will notify you of changes
              </li>
              <li>• Your agreement is required to use our platform</li>
              <li>
                • You can view these documents anytime in your account settings
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={handleDecline}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Decline
          </button>

          <button
            onClick={handleAgree}
            disabled={!canProceed || isLoading}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />I Agree & Continue
              </>
            )}
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Agreement Progress</span>
            <span>
              {
                [
                  hasReadTerms,
                  hasReadPrivacy,
                  hasAgreedToTerms,
                  hasAgreedToPrivacy,
                ].filter(Boolean).length
              }
              /4
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ([
                    hasReadTerms,
                    hasReadPrivacy,
                    hasAgreedToTerms,
                    hasAgreedToPrivacy,
                  ].filter(Boolean).length /
                    4) *
                  100
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
