export default function BusinessLicensePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Business License & Credentials
          </h1>
          <p className="text-gray-400">
            Official business information and certifications
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Company Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Business Name</p>
                  <p className="text-white">Pro-DJ Booking Platform</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Legal Entity</p>
                  <p className="text-white">Pro-DJ LLC</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">State of Formation</p>
                  <p className="text-white">Delaware</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Year Established</p>
                  <p className="text-white">2024</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Business Type</p>
                  <p className="text-white">Limited Liability Company</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">
              State Business License
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">License Number</p>
                  <p className="text-white">BL-2024-001234</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Issuing Authority</p>
                  <p className="text-white">State Business Bureau</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Issue Date</p>
                  <p className="text-white">January 15, 2024</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Expiration Date</p>
                  <p className="text-white">January 15, 2025</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-green-400">Active</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Service Area</p>
                  <p className="text-white">Nationwide</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Payment Processing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Processor</p>
                  <p className="text-white">Stripe, Inc.</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Account ID</p>
                  <p className="text-white">acct_1234567890</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">PCI Compliance</p>
                  <p className="text-white">Level 1</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">
                    Security Certification
                  </p>
                  <p className="text-white">SOC 2 Type II</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Data Protection</p>
                  <p className="text-white">GDPR Compliant</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Fraud Protection</p>
                  <p className="text-white">Stripe Radar Enabled</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Insurance Coverage</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">General Liability</p>
                  <p className="text-white">$2,000,000</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">
                    Professional Liability
                  </p>
                  <p className="text-white">$1,000,000</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Cyber Liability</p>
                  <p className="text-white">$500,000</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Insurance Provider</p>
                  <p className="text-white">Business Insurance Co.</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Policy Number</p>
                  <p className="text-white">INS-2024-789012</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Effective Date</p>
                  <p className="text-white">January 1, 2024</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Business Address</h2>
            <div className="space-y-3">
              <p className="text-white">Pro-DJ Booking Platform</p>
              <p className="text-white">123 Business Street</p>
              <p className="text-white">Your City, Your State 12345</p>
              <p className="text-white">United States</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
