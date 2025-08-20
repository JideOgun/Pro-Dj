import Link from "next/link";
import {
  Calendar,
  Shield,
  Users,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-300 mb-4">
              By accessing and using Pro-DJ, you accept and agree to be bound by
              the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-300 mb-4">
              Pro-DJ is a platform that connects DJs with clients for booking
              events. The service includes:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>DJ profile creation and management</li>
              <li>Event booking and scheduling</li>
              <li>Payment processing</li>
              <li>Communication tools between DJs and clients</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. User Responsibilities
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">For DJs:</h3>
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                  <li>Provide accurate and up-to-date profile information</li>
                  <li>
                    Maintain professional conduct and deliver quality services
                  </li>
                  <li>Respond to booking requests in a timely manner</li>
                  <li>Honor confirmed bookings and agreements</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">For Clients:</h3>
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                  <li>Provide accurate event details and requirements</li>
                  <li>Make payments according to agreed terms</li>
                  <li>Communicate clearly with selected DJs</li>
                  <li>Respect cancellation policies</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
            <p className="text-gray-300 mb-4">
              All payments are processed securely through our payment partners.
              Payment terms are as follows:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>Full payment is required to confirm bookings</li>
              <li>Refunds are subject to our refund policy</li>
              <li>Service fees may apply to transactions</li>
              <li>Prices are subject to change with notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Cancellation Policy
            </h2>
            <p className="text-gray-300 mb-4">
              Cancellations must be made according to the following terms:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>More than 7 days before event: Full refund</li>
              <li>3-7 days before event: 50% refund</li>
              <li>Less than 3 days before event: No refund</li>
              <li>Force majeure events may be considered for exceptions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Privacy and Data Protection
            </h2>
            <p className="text-gray-300 mb-4">
              We are committed to protecting your privacy. Please review our
              Privacy Policy for details on how we collect, use, and protect
              your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-gray-300 mb-4">
              Pro-DJ acts as a platform connecting DJs and clients. We are not
              responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>The quality of DJ services provided</li>
              <li>Disputes between DJs and clients</li>
              <li>Event outcomes or client satisfaction</li>
              <li>Equipment failures or technical issues during events</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
            <p className="text-gray-300 mb-4">
              We reserve the right to terminate or suspend accounts that violate
              these terms. Users may also terminate their accounts at any time
              through their account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-gray-300 mb-4">
              We may update these terms from time to time. Users will be
              notified of significant changes, and continued use of the platform
              constitutes acceptance of updated terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Contact Information
            </h2>
            <p className="text-gray-300 mb-4">
              For questions about these terms, please contact us through our
              support channels or visit our contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
