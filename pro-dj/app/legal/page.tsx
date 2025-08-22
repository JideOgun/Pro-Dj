import Link from "next/link";
import {
  Shield,
  FileText,
  RefreshCw,
  Users,
  Building,
  CheckCircle,
} from "lucide-react";

export default function LegalIndexPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Legal Information</h1>
          <p className="text-gray-300 text-lg">
            Important legal documents and business information for Pro-DJ
            Booking Platform
          </p>
        </div>

        {/* Legal Documents Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link href="/legal/terms" className="group">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-violet-500">
              <div className="flex items-center mb-4">
                <Shield className="w-8 h-8 text-violet-400 mr-3" />
                <h2 className="text-xl font-semibold text-violet-300 group-hover:text-violet-200">
                  Terms of Service
                </h2>
              </div>
              <p className="text-gray-300 mb-4">
                Our terms and conditions governing the use of the Pro-DJ
                platform, including user responsibilities, booking policies, and
                service agreements.
              </p>
              <div className="flex items-center text-violet-400 text-sm">
                <span>Read Terms</span>
                <svg
                  className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/legal/privacy" className="group">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-violet-500">
              <div className="flex items-center mb-4">
                <Shield className="w-8 h-8 text-violet-400 mr-3" />
                <h2 className="text-xl font-semibold text-violet-300 group-hover:text-violet-200">
                  Privacy Policy
                </h2>
              </div>
              <p className="text-gray-300 mb-4">
                How we collect, use, and protect your personal information,
                including data practices, security measures, and your privacy
                rights.
              </p>
              <div className="flex items-center text-violet-400 text-sm">
                <span>Read Privacy Policy</span>
                <svg
                  className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/legal/refund" className="group">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-violet-500">
              <div className="flex items-center mb-4">
                <RefreshCw className="w-8 h-8 text-violet-400 mr-3" />
                <h2 className="text-xl font-semibold text-violet-300 group-hover:text-violet-200">
                  Refund Policy
                </h2>
              </div>
              <p className="text-gray-300 mb-4">
                Our refund and cancellation policies, including timeframes,
                refund amounts, and the process for requesting refunds.
              </p>
              <div className="flex items-center text-violet-400 text-sm">
                <span>Read Refund Policy</span>
                <svg
                  className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/legal/contact" className="group">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-violet-500">
              <div className="flex items-center mb-4">
                <Users className="w-8 h-8 text-violet-400 mr-3" />
                <h2 className="text-xl font-semibold text-violet-300 group-hover:text-violet-200">
                  Contact & Business Info
                </h2>
              </div>
              <p className="text-gray-300 mb-4">
                Complete business information, licenses, certifications, and
                multiple ways to contact our support team.
              </p>
              <div className="flex items-center text-violet-400 text-sm">
                <span>View Contact Info</span>
                <svg
                  className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Important Information */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-violet-400 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Important Legal Information
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-violet-300 mb-1">
                    Compliance
                  </h3>
                  <p className="text-gray-300 text-sm">
                    All legal documents are compliant with applicable laws and
                    regulations including GDPR, CCPA, and PCI DSS standards.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-violet-300 mb-1">
                    Regular Updates
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Legal documents are regularly reviewed and updated to ensure
                    compliance with current laws and business practices.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-violet-300 mb-1">
                    Transparency
                  </h3>
                  <p className="text-gray-300 text-sm">
                    We believe in full transparency. All terms, policies, and
                    business information are clearly stated and easily
                    accessible.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-violet-300 mb-1">
                    Customer Support
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Questions about our legal documents? Our support team is
                    available to help clarify any terms or policies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Credentials */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-violet-400 flex items-center">
            <Building className="w-6 h-6 mr-2" />
            Business Credentials
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <h3 className="font-medium text-violet-300 mb-2">
                Business License
              </h3>
              <p className="text-gray-300 text-sm">BL-2024-001234</p>
              <p className="text-green-400 text-xs mt-1">Active</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <h3 className="font-medium text-violet-300 mb-2">Insurance</h3>
              <p className="text-gray-300 text-sm">$2M Coverage</p>
              <p className="text-green-400 text-xs mt-1">Active</p>
            </div>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-violet-300">
            Need Legal Assistance?
          </h2>
          <p className="text-gray-300 mb-6">
            If you have questions about our legal documents or need
            clarification on any terms, our legal team is here to help.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-violet-300 mb-2">
                Legal Inquiries
              </h3>
              <a
                href="mailto:legal@pro-dj.com"
                className="text-violet-400 hover:underline"
              >
                legal@pro-dj.com
              </a>
              <p className="text-gray-400 text-sm mt-1">
                Response within 48 hours
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-violet-300 mb-2">
                General Support
              </h3>
              <a
                href="mailto:support@pro-dj.com"
                className="text-violet-400 hover:underline"
              >
                support@pro-dj.com
              </a>
              <p className="text-gray-400 text-sm mt-1">
                Response within 24 hours
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400">
          <p>
            © {new Date().getFullYear()} Pro-DJ Booking Platform. All rights
            reserved.
          </p>
          <p className="text-sm mt-2">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
