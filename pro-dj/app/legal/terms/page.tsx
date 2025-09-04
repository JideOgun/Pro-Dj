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
              Pro-DJ is a professional DJ service company that provides
              high-quality entertainment through our network of trained
              subcontractor DJs. Our services include:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>
                Professional DJ services for events under the Pro-DJ brand
              </li>
              <li>Curated network of certified subcontractor DJs</li>
              <li>Professional-grade equipment and setup</li>
              <li>Event booking and scheduling coordination</li>
              <li>Payment processing and escrow services</li>
              <li>Quality assurance and performance monitoring</li>
            </ul>
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-gray-300">
                <strong>Note:</strong> All DJs performing under the Pro-DJ brand
                are independent subcontractors who have completed our
                certification process and maintain our quality standards.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. User Responsibilities
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  For DJ Subcontractors:
                </h3>
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                  <li>
                    Complete all required training and certification programs
                  </li>
                  <li>
                    Maintain professional conduct and Pro-DJ brand standards
                  </li>
                  <li>
                    Use only Pro-DJ provided equipment and branding materials
                  </li>
                  <li>Honor confirmed bookings and subcontractor agreements</li>
                  <li>
                    Maintain valid business license and insurance coverage
                  </li>
                  <li>
                    Handle tax responsibilities as an independent contractor
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">For Clients:</h3>
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                  <li>Provide accurate event details and requirements</li>
                  <li>Make payments according to agreed terms</li>
                  <li>Communicate clearly with Pro-DJ and assigned DJs</li>
                  <li>Respect cancellation policies and escrow procedures</li>
                  <li>Understand that all DJs are Pro-DJ subcontractors</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
            <p className="text-gray-300 mb-4">
              All payments are processed securely through Stripe with escrow
              protection. Payment terms are as follows:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>Full payment is required to confirm bookings</li>
              <li>Payments are held in escrow until event completion</li>
              <li>Funds are released after client and DJ confirmation</li>
              <li>
                70% of booking fee retained by Pro-DJ, 30% paid to subcontractor
                DJ
              </li>
              <li>Refunds are subject to our cancellation policy</li>
              <li>Dispute resolution process available for payment issues</li>
              <li>Prices are subject to change with advance notice</li>
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
              7. Service Delivery and Liability
            </h2>
            <p className="text-gray-300 mb-4">
              Pro-DJ provides professional DJ services through our network of
              certified subcontractors. Our commitment includes:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>
                Quality assurance through subcontractor training and
                certification
              </li>
              <li>Professional-grade equipment and setup</li>
              <li>Performance monitoring and client satisfaction tracking</li>
              <li>Backup DJ availability for emergency situations</li>
            </ul>
            <p className="text-gray-300 mb-4">
              However, Pro-DJ's liability is limited and we are not responsible
              for:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>Acts of individual subcontractors beyond our control</li>
              <li>
                Force majeure events (weather, natural disasters, venue issues)
              </li>
              <li>
                Client-specific music requests that violate copyright laws
              </li>
              <li>Venue-specific technical limitations or restrictions</li>
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
