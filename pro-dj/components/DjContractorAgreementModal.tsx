"use client";

import { useState } from "react";
import {
  Check,
  X,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  Building,
  CreditCard,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

interface DjContractorAgreementModalProps {
  isOpen: boolean;
  onAgree: (taxInfo: TaxInfo) => void;
  onDecline: () => void;
  isLoading?: boolean;
}

interface TaxInfo {
  isCorporation: boolean;
  isSoleProprietor: boolean;
}

export default function DjContractorAgreementModal({
  isOpen,
  onAgree,
  onDecline,
  isLoading = false,
}: DjContractorAgreementModalProps) {
  const [hasReadContractorTerms, setHasReadContractorTerms] = useState(false);
  const [hasReadServiceProviderTerms, setHasReadServiceProviderTerms] =
    useState(false);
  const [hasAgreedToContractorTerms, setHasAgreedToContractorTerms] =
    useState(false);
  const [hasAgreedToServiceProviderTerms, setHasAgreedToServiceProviderTerms] =
    useState(false);
  const [showContractorTerms, setShowContractorTerms] = useState(false);
  const [showServiceProviderTerms, setShowServiceProviderTerms] =
    useState(false);

  // Business type selection
  const [taxInfo, setTaxInfo] = useState<TaxInfo>({
    isCorporation: false,
    isSoleProprietor: false, // No auto-selection
  });

  const canProceed =
    hasReadContractorTerms &&
    hasReadServiceProviderTerms &&
    hasAgreedToContractorTerms &&
    hasAgreedToServiceProviderTerms &&
    (taxInfo.isSoleProprietor || taxInfo.isCorporation);

  const handleAgree = () => {
    if (canProceed) {
      onAgree(taxInfo);
    }
  };

  const handleDecline = () => {
    onDecline();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Independent Contractor Agreement
              </h2>
              <p className="text-gray-400 text-sm">
                Required for all DJ service providers
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
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-300 font-medium mb-2">
                  Important: Independent Contractor Status
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  As a DJ service provider on our platform, you will be
                  classified as an independent contractor. This means you are
                  responsible for your own taxes, insurance, and business
                  compliance. Please review all agreements carefully and provide
                  accurate tax information.
                </p>
              </div>
            </div>
          </div>

          {/* Independent Contractor Agreement Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-medium text-white">
                  Independent Contractor Agreement
                </h3>
              </div>
              <button
                onClick={() => setShowContractorTerms(!showContractorTerms)}
                className="flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm transition-colors"
              >
                <span>{showContractorTerms ? "Hide" : "Read"} Agreement</span>
                {showContractorTerms ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="bg-gray-700/30 rounded-lg border border-gray-600/30 overflow-hidden">
              {showContractorTerms && (
                <div className="p-4 border-b border-gray-600/30 max-h-60 overflow-y-auto">
                  <div className="text-gray-300 text-sm space-y-3">
                    <h4 className="font-semibold text-white">
                      Pro-DJ Independent Contractor Agreement
                    </h4>
                    <p>
                      <strong>1. Independent Contractor Status</strong>
                      <br />
                      You acknowledge that you are an independent contractor and
                      not an employee of Pro-DJ. You are responsible for your
                      own taxes, insurance, and business compliance.
                    </p>
                    <p>
                      <strong>2. Services and Compensation</strong>
                      <br />
                      You will provide DJ services to clients through our
                      platform. Compensation will be based on your hourly rates
                      and any additional services provided.
                    </p>
                    <p>
                      <strong>3. Tax Responsibilities</strong>
                      <br />
                      You are responsible for reporting and paying all
                      applicable taxes, including self-employment tax, income
                      tax, and any state/local taxes.
                    </p>
                    <p>
                      <strong>4. Business Expenses</strong>
                      <br />
                      You are responsible for all costs related to your
                      business, including equipment, transportation, insurance,
                      and licensing.
                    </p>
                    <p>
                      <strong>5. Liability and Insurance</strong>
                      <br />
                      You must maintain appropriate liability insurance and are
                      responsible for any damages or injuries during your
                      services.
                    </p>
                    <p>
                      <strong>6. Platform Fees</strong>
                      <br />
                      Pro-DJ will deduct a service fee from each booking. The
                      current fee structure is [X%] of the total booking amount.
                    </p>
                    <p>
                      <strong>7. Termination</strong>
                      <br />
                      Either party may terminate this agreement with written
                      notice. Pro-DJ reserves the right to suspend or terminate
                      access for violations of platform policies.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-300 text-sm">
                    This agreement establishes your status as an independent
                    contractor and outlines your responsibilities and rights as
                    a service provider.
                  </p>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasReadContractorTerms}
                        onChange={(e) =>
                          setHasReadContractorTerms(e.target.checked)
                        }
                        disabled={isLoading}
                        className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 focus:ring-2"
                      />
                      <span className="text-gray-300 text-sm">I have read</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasAgreedToContractorTerms}
                        onChange={(e) =>
                          setHasAgreedToContractorTerms(e.target.checked)
                        }
                        disabled={isLoading || !hasReadContractorTerms}
                        className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 focus:ring-2 disabled:opacity-50"
                      />
                      <span className="text-gray-300 text-sm">I agree</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Provider Terms Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-medium text-white">
                  Service Provider Terms
                </h3>
              </div>
              <button
                onClick={() =>
                  setShowServiceProviderTerms(!showServiceProviderTerms)
                }
                className="flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm transition-colors"
              >
                <span>{showServiceProviderTerms ? "Hide" : "Read"} Terms</span>
                {showServiceProviderTerms ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="bg-gray-700/30 rounded-lg border border-gray-600/30 overflow-hidden">
              {showServiceProviderTerms && (
                <div className="p-4 border-b border-gray-600/30 max-h-60 overflow-y-auto">
                  <div className="text-gray-300 text-sm space-y-3">
                    <h4 className="font-semibold text-white">
                      Pro-DJ Service Provider Terms
                    </h4>
                    <p>
                      <strong>1. Service Quality Standards</strong>
                      <br />
                      You agree to provide professional DJ services that meet
                      industry standards and maintain a positive reputation for
                      the platform.
                    </p>
                    <p>
                      <strong>2. Equipment and Setup</strong>
                      <br />
                      You are responsible for providing and maintaining all
                      necessary equipment and ensuring proper setup and teardown
                      at events.
                    </p>
                    <p>
                      <strong>3. Cancellation Policy</strong>
                      <br />
                      You must provide reasonable notice for cancellations and
                      may be subject to penalties for late cancellations.
                    </p>
                    <p>
                      <strong>4. Client Communication</strong>
                      <br />
                      You agree to maintain professional communication with
                      clients and respond to inquiries in a timely manner.
                    </p>
                    <p>
                      <strong>5. Content and Licensing</strong>
                      <br />
                      You must ensure you have proper licensing for all music
                      played and comply with copyright laws.
                    </p>
                    <p>
                      <strong>6. Safety and Compliance</strong>
                      <br />
                      You must comply with all applicable laws, regulations, and
                      venue requirements during your services.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-300 text-sm">
                    These terms outline your responsibilities as a service
                    provider and the standards you must maintain.
                  </p>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasReadServiceProviderTerms}
                        onChange={(e) =>
                          setHasReadServiceProviderTerms(e.target.checked)
                        }
                        disabled={isLoading}
                        className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 focus:ring-2"
                      />
                      <span className="text-gray-300 text-sm">I have read</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasAgreedToServiceProviderTerms}
                        onChange={(e) =>
                          setHasAgreedToServiceProviderTerms(e.target.checked)
                        }
                        disabled={isLoading || !hasReadServiceProviderTerms}
                        className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 focus:ring-2 disabled:opacity-50"
                      />
                      <span className="text-gray-300 text-sm">I agree</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-medium text-white">
                Business Type Selection
              </h3>
            </div>

            <div className="bg-gray-700/30 rounded-lg border border-gray-600/30 overflow-hidden">
              <div className="p-4 border-b border-gray-600/30">
                <div className="text-gray-300 text-sm space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      How do you operate? *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="businessType"
                          checked={taxInfo.isSoleProprietor}
                          onChange={() =>
                            setTaxInfo({
                              ...taxInfo,
                              isSoleProprietor: true,
                              isCorporation: false,
                            })
                          }
                          className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 focus:ring-violet-500 focus:ring-2"
                        />
                        <span className="text-gray-300 text-sm">
                          Sole Proprietor (using my personal SSN)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="businessType"
                          checked={taxInfo.isCorporation}
                          onChange={() =>
                            setTaxInfo({
                              ...taxInfo,
                              isCorporation: true,
                              isSoleProprietor: false,
                            })
                          }
                          className="w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 focus:ring-violet-500 focus:ring-2"
                        />
                        <span className="text-gray-300 text-sm">
                          Corporation/LLC (using EIN)
                        </span>
                      </label>
                    </div>
                    {!taxInfo.isSoleProprietor && !taxInfo.isCorporation && (
                      <p className="text-red-400 text-xs mt-1">
                        Please select how you operate
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="text-gray-300 text-sm">
                  This selection will be used when you're ready to start
                  receiving payments. You'll be prompted to provide your tax
                  information (SSN or EIN) at that time.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="text-yellow-300 font-medium mb-2">
              Important Tax Information
            </h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>
                • You are responsible for reporting and paying all applicable
                taxes
              </li>
              <li>
                • We will issue 1099 forms for payments over $600 annually
              </li>
              <li>
                • Keep records of all business expenses for tax deductions
              </li>
              <li>• Consider consulting with a tax professional</li>
              <li>• You may need to make quarterly estimated tax payments</li>
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
                  hasReadContractorTerms,
                  hasReadServiceProviderTerms,
                  hasAgreedToContractorTerms,
                  hasAgreedToServiceProviderTerms,
                  taxInfo.isSoleProprietor || taxInfo.isCorporation,
                ].filter(Boolean).length
              }
              /5
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ([
                    hasReadContractorTerms,
                    hasReadServiceProviderTerms,
                    hasAgreedToContractorTerms,
                    hasAgreedToServiceProviderTerms,
                    taxInfo.isSoleProprietor || taxInfo.isCorporation,
                  ].filter(Boolean).length /
                    5) *
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
