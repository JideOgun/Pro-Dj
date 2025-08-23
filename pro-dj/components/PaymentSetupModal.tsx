"use client";

import { useState } from "react";
import {
  Check,
  X,
  CreditCard,
  Shield,
  AlertTriangle,
  DollarSign,
  UserCheck,
} from "lucide-react";

interface PaymentSetupModalProps {
  isOpen: boolean;
  onComplete: (taxInfo: TaxInfo) => void;
  onCancel: () => void;
  isLoading?: boolean;
  businessType?: "SOLE_PROPRIETOR" | "CORPORATION";
}

interface TaxInfo {
  taxId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  isCorporation: boolean;
  isSoleProprietor: boolean;
}

export default function PaymentSetupModal({
  isOpen,
  onComplete,
  onCancel,
  isLoading = false,
  businessType = "SOLE_PROPRIETOR",
}: PaymentSetupModalProps) {
  const [taxInfo, setTaxInfo] = useState<TaxInfo>({
    taxId: "",
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    isCorporation: businessType === "CORPORATION",
    isSoleProprietor: businessType === "SOLE_PROPRIETOR",
  });

  const canProceed =
    (taxInfo.isSoleProprietor || taxInfo.isCorporation) &&
    taxInfo.taxId.trim() &&
    // Validate SSN/EIN format (must be exactly 9 digits)
    taxInfo.taxId.replace(/\D/g, "").length === 9 &&
    (taxInfo.isSoleProprietor ||
      (taxInfo.businessName.trim() &&
        taxInfo.businessAddress.trim() &&
        taxInfo.businessPhone.trim() &&
        // Validate phone format (must be exactly 10 digits)
        taxInfo.businessPhone.replace(/\D/g, "").length === 10));

  const handleComplete = () => {
    if (canProceed) {
      onComplete(taxInfo);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Payment Setup Required
              </h2>
              <p className="text-gray-400 text-sm">
                Complete your tax information to start receiving payments
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-green-300 font-medium mb-2">
                  Ready to Start Earning?
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  To process payments and issue tax forms, we need your tax
                  information. This is required for all service providers who
                  receive payments through our platform.
                </p>
              </div>
            </div>
          </div>

          {/* Business Type Display */}
          <div className="bg-gray-700/30 rounded-lg border border-gray-600/30 p-4">
            <div className="flex items-center gap-3 mb-3">
              <UserCheck className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-medium text-white">Business Type</h3>
            </div>
            <div className="text-gray-300 text-sm">
              <p>
                <strong>Current Setup:</strong>{" "}
                {taxInfo.isSoleProprietor
                  ? "Sole Proprietor (using personal SSN)"
                  : "Corporation/LLC (using EIN)"}
              </p>
              <p className="text-gray-400 mt-1">
                This was set during your initial registration. Contact support
                if you need to change this.
              </p>
            </div>
          </div>

          {/* Tax Information Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-medium text-white">
                Tax Information (Required)
              </h3>
            </div>

            <div className="bg-gray-700/30 rounded-lg border border-gray-600/30 overflow-hidden">
              <div className="p-4 border-b border-gray-600/30">
                <div className="text-gray-300 text-sm space-y-4">
                  {/* Tax ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {taxInfo.isSoleProprietor
                        ? "Social Security Number (SSN)"
                        : "Employer Identification Number (EIN)"}{" "}
                      *
                    </label>
                    <input
                      type="text"
                      value={taxInfo.taxId}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

                        if (taxInfo.isSoleProprietor) {
                          // Format SSN: XXX-XX-XXXX
                          if (value.length <= 3) {
                            value = value;
                          } else if (value.length <= 5) {
                            value = value.slice(0, 3) + "-" + value.slice(3);
                          } else {
                            value =
                              value.slice(0, 3) +
                              "-" +
                              value.slice(3, 5) +
                              "-" +
                              value.slice(5, 9);
                          }
                        } else {
                          // Format EIN: XX-XXXXXXX
                          if (value.length <= 2) {
                            value = value;
                          } else {
                            value = value.slice(0, 2) + "-" + value.slice(2, 9);
                          }
                        }

                        setTaxInfo({ ...taxInfo, taxId: value });
                      }}
                      onBlur={(e) => {
                        let value = e.target.value.replace(/\D/g, "");

                        if (value.length !== 9) {
                          e.target.classList.add("border-red-500");
                        } else {
                          e.target.classList.remove("border-red-500");
                        }
                      }}
                      maxLength={taxInfo.isSoleProprietor ? 11 : 10}
                      placeholder={
                        taxInfo.isSoleProprietor ? "123-45-6789" : "12-3456789"
                      }
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    {taxInfo.taxId && (
                      <div className="mt-1">
                        {taxInfo.taxId.replace(/\D/g, "").length !== 9 && (
                          <p className="text-red-400 text-xs">
                            {taxInfo.isSoleProprietor
                              ? "SSN must be exactly 9 digits"
                              : "EIN must be exactly 9 digits"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conditional Business Information */}
                  {taxInfo.isCorporation && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Legal Business Name *
                        </label>
                        <input
                          type="text"
                          value={taxInfo.businessName}
                          onChange={(e) =>
                            setTaxInfo({
                              ...taxInfo,
                              businessName: e.target.value,
                            })
                          }
                          placeholder="Your legal business name"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Business Address *
                        </label>
                        <textarea
                          value={taxInfo.businessAddress}
                          onChange={(e) =>
                            setTaxInfo({
                              ...taxInfo,
                              businessAddress: e.target.value,
                            })
                          }
                          placeholder="Complete business address"
                          rows={3}
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Business Phone *
                        </label>
                        <input
                          type="tel"
                          value={taxInfo.businessPhone}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

                            // Format phone number: (XXX) XXX-XXXX
                            if (value.length <= 3) {
                              value = value;
                            } else if (value.length <= 6) {
                              value =
                                "(" + value.slice(0, 3) + ") " + value.slice(3);
                            } else {
                              value =
                                "(" +
                                value.slice(0, 3) +
                                ") " +
                                value.slice(3, 6) +
                                "-" +
                                value.slice(6, 10);
                            }

                            setTaxInfo({
                              ...taxInfo,
                              businessPhone: value,
                            });
                          }}
                          onBlur={(e) => {
                            let value = e.target.value.replace(/\D/g, "");

                            if (value.length !== 10) {
                              e.target.classList.add("border-red-500");
                            } else {
                              e.target.classList.remove("border-red-500");
                            }
                          }}
                          maxLength={14}
                          placeholder="(555) 123-4567"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                        {taxInfo.businessPhone &&
                          taxInfo.businessPhone.replace(/\D/g, "").length !==
                            10 && (
                            <p className="text-red-400 text-xs mt-1">
                              Phone number must be exactly 10 digits
                            </p>
                          )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4">
                <p className="text-gray-300 text-sm">
                  {taxInfo.isSoleProprietor
                    ? "For sole proprietors, we only need your SSN for tax reporting. We'll use your personal information from your profile."
                    : "This information is required for tax reporting purposes. We will issue 1099 forms for payments exceeding $600 annually."}
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-300 font-medium mb-2">
                  Your Information is Secure
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  All tax information is encrypted using industry-standard
                  AES-256 encryption and stored securely. We only use this
                  information for tax reporting purposes and never share it with
                  third parties.
                </p>
              </div>
            </div>
          </div>

          {/* Tax Information */}
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
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleComplete}
            disabled={!canProceed || isLoading}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Complete Setup
              </>
            )}
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Setup Progress</span>
            <span>
              {
                [
                  taxInfo.isSoleProprietor || taxInfo.isCorporation,
                  taxInfo.taxId.trim(),
                  // Only count business fields if corporation
                  ...(taxInfo.isCorporation
                    ? [
                        taxInfo.businessName.trim(),
                        taxInfo.businessAddress.trim(),
                        taxInfo.businessPhone.trim(),
                      ]
                    : []),
                ].filter(Boolean).length
              }
              /{taxInfo.isSoleProprietor ? 2 : 5}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ([
                    taxInfo.isSoleProprietor || taxInfo.isCorporation,
                    taxInfo.taxId.trim(),
                    // Only count business fields if corporation
                    ...(taxInfo.isCorporation
                      ? [
                          taxInfo.businessName.trim(),
                          taxInfo.businessAddress.trim(),
                          taxInfo.businessPhone.trim(),
                        ]
                      : []),
                  ].filter(Boolean).length /
                    (taxInfo.isSoleProprietor ? 2 : 5)) *
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
