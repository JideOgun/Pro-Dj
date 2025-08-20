import Link from "next/link";
import { Shield, Eye, Lock, Database, Users, Mail, Phone } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  Personal Information
                </h3>
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                  <li>Name and contact information</li>
                  <li>Email address and phone number</li>
                  <li>Profile information and preferences</li>
                  <li>Payment information (processed securely)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Usage Information</h3>
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                  <li>Booking history and preferences</li>
                  <li>Platform usage patterns</li>
                  <li>Device and browser information</li>
                  <li>Location data (with consent)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-300 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>Provide and improve our services</li>
              <li>Process bookings and payments</li>
              <li>Communicate with you about your account</li>
              <li>Send important updates and notifications</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. Information Sharing
            </h2>
            <p className="text-gray-300 mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>DJs and clients to facilitate bookings</li>
              <li>Payment processors for secure transactions</li>
              <li>Service providers who assist our operations</li>
              <li>Legal authorities when required by law</li>
              <li>Other users only with your explicit consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement industry-standard security measures to protect your
              personal information:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>Encryption of sensitive data</li>
              <li>Secure payment processing</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Data backup and recovery procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p className="text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Cookies and Tracking
            </h2>
            <p className="text-gray-300 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>Remember your preferences and settings</li>
              <li>Analyze platform usage and performance</li>
              <li>Provide personalized content and recommendations</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-gray-300 mb-4">
              We retain your information for as long as necessary to provide our
              services and comply with legal obligations. You can request
              deletion of your account and associated data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. International Transfers
            </h2>
            <p className="text-gray-300 mb-4">
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              to protect your data during such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-gray-300 mb-4">
              Our service is not intended for children under 13. We do not
              knowingly collect personal information from children under 13. If
              you believe we have collected such information, please contact us
              immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-300 mb-4">
              We may update this privacy policy from time to time. We will
              notify you of any material changes and obtain your consent where
              required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have questions about this privacy policy or our data
              practices, please contact us through our support channels or visit
              our contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
