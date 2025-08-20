import Link from "next/link";
import {
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Refund Policy</h1>
          <p className="text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
            <p className="text-gray-300 mb-4">
              This refund policy outlines the terms and conditions for refunds
              on the Pro-DJ platform. We strive to ensure fair and transparent
              refund processes for all users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Cancellation Timeframes
            </h2>
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-300 font-medium mb-2">
                  Full Refund (100%)
                </h3>
                <p className="text-gray-300 text-sm">
                  Cancellations made more than 7 days before the event date
                </p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="text-yellow-300 font-medium mb-2">
                  Partial Refund (50%)
                </h3>
                <p className="text-gray-300 text-sm">
                  Cancellations made 3-7 days before the event date
                </p>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-red-300 font-medium mb-2">
                  No Refund (0%)
                </h3>
                <p className="text-gray-300 text-sm">
                  Cancellations made less than 3 days before the event date
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Refund Process</h2>
            <ol className="list-decimal list-inside text-gray-300 ml-4 space-y-2">
              <li>
                Submit cancellation request through your account dashboard
              </li>
              <li>Our team will review the request within 24 hours</li>
              <li>
                If approved, refund will be processed within 5-10 business days
              </li>
              <li>Refund will be issued to the original payment method</li>
              <li>
                You will receive email confirmation when refund is processed
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Special Circumstances
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  Force Majeure Events
                </h3>
                <p className="text-gray-300 mb-2">
                  Full refunds may be provided for events beyond anyone&apos;s
                  control:
                </p>
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                  <li>Natural disasters</li>
                  <li>Government restrictions</li>
                  <li>Pandemics or health emergencies</li>
                  <li>Venue closures or cancellations</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">DJ Cancellations</h3>
                <p className="text-gray-300 mb-2">
                  If a DJ cancels your booking:
                </p>
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                  <li>Full refund will be provided</li>
                  <li>We will help you find an alternative DJ</li>
                  <li>Additional compensation may be offered</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Non-Refundable Items
            </h2>
            <p className="text-gray-300 mb-4">
              The following are typically non-refundable:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>Service fees and processing charges</li>
              <li>Deposits for custom equipment or special requests</li>
              <li>Travel expenses already incurred by DJs</li>
              <li>Administrative fees for late cancellations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Dispute Resolution
            </h2>
            <p className="text-gray-300 mb-4">
              If you disagree with a refund decision, you may:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2">
              <li>Contact our customer support team</li>
              <li>Provide additional documentation or evidence</li>
              <li>Request escalation to a senior team member</li>
              <li>Submit a formal complaint through our support channels</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Contact Information
            </h2>
            <p className="text-gray-300 mb-4">
              For refund requests or questions about this policy, please contact
              us through our support channels or visit our contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
