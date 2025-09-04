import Link from "next/link";
import {
  FileText,
  Shield,
  DollarSign,
  Briefcase,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function SubcontractorAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Pro-DJ Subcontractor Agreement
          </h1>
          <p className="text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-blue-400">
                Independent Contractor Status
              </span>
            </div>
            <p className="text-sm text-gray-300">
              This agreement establishes you as an independent subcontractor,
              not an employee of Pro-DJ.
            </p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              1. Agreement Overview
            </h2>
            <p className="text-gray-300 mb-4">
              This Subcontractor Agreement ("Agreement") is entered into between
              Pro-DJ LLC ("Company") and the DJ ("Subcontractor") for the
              provision of DJ services under the Pro-DJ brand.
            </p>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-amber-400">
                  Important Notice
                </span>
              </div>
              <p className="text-sm text-gray-300">
                You are an independent contractor, not an employee. You are
                responsible for your own taxes, insurance, and business
                expenses.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-6 h-6" />
              2. Independent Contractor Relationship
            </h2>
            <p className="text-gray-300 mb-4">
              The Subcontractor acknowledges and agrees that:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>
                You are an independent contractor, not an employee of Pro-DJ
              </li>
              <li>
                You are responsible for all federal, state, and local taxes
              </li>
              <li>You must provide your own business license and insurance</li>
              <li>
                You will receive a 1099 tax form for payments over $600 annually
              </li>
              <li>
                No employment benefits are provided (health insurance, vacation,
                etc.)
              </li>
              <li>You maintain control over how you perform your services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              3. Services and Brand Standards
            </h2>
            <p className="text-gray-300 mb-4">
              As a Pro-DJ subcontractor, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>Provide professional DJ services under the Pro-DJ brand</li>
              <li>Use Pro-DJ provided equipment and branding materials</li>
              <li>
                Maintain professional appearance and conduct at all events
              </li>
              <li>Complete required training programs and certifications</li>
              <li>Follow Pro-DJ's quality standards and procedures</li>
              <li>Represent the Pro-DJ brand professionally at all times</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              4. Compensation Structure
            </h2>
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                Revenue Split: 70% Pro-DJ / 30% Subcontractor
              </h3>
              <p className="text-gray-300 text-sm">
                For each completed event, you will receive 30% of the total
                booking fee, with 70% retained by Pro-DJ for equipment,
                marketing, and platform costs.
              </p>
            </div>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>
                Payments processed via Stripe Connect within 2-7 business days
              </li>
              <li>
                Revenue split may be customized based on performance and tenure
              </li>
              <li>
                Bonus opportunities available for high-performing subcontractors
              </li>
              <li>No guaranteed minimum hours or income</li>
              <li>
                Payment contingent on successful event completion and client
                satisfaction
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Equipment and Materials
            </h2>
            <p className="text-gray-300 mb-4">Pro-DJ will provide:</p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>
                Professional DJ equipment (speakers, mixers, microphones,
                lighting)
              </li>
              <li>Pro-DJ branded materials and promotional items</li>
              <li>Transportation and setup instructions</li>
              <li>Technical support and equipment training</li>
            </ul>
            <p className="text-gray-300 mb-4">
              Subcontractor responsibilities:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>Proper care and handling of all equipment</li>
              <li>Immediate reporting of any damage or technical issues</li>
              <li>Return equipment in good condition after each event</li>
              <li>
                Liability for equipment replacement if damaged due to negligence
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Training and Certification
            </h2>
            <p className="text-gray-300 mb-4">
              Before accepting bookings, subcontractors must complete:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>Background check verification</li>
              <li>Equipment operation and safety training</li>
              <li>Pro-DJ brand standards and presentation training</li>
              <li>Customer service and communication protocols</li>
              <li>Emergency procedures and troubleshooting</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Performance Standards
            </h2>
            <p className="text-gray-300 mb-4">Subcontractors must maintain:</p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>Minimum 4.5-star average client rating</li>
              <li>
                Professional punctuality (arrive 30 minutes before event start)
              </li>
              <li>Appropriate professional attire</li>
              <li>Responsive communication with clients and Pro-DJ staff</li>
              <li>Compliance with all local laws and venue requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              8. Insurance and Liability
            </h2>
            <p className="text-gray-300 mb-4">Insurance requirements:</p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>
                General liability insurance (minimum $1M coverage recommended)
              </li>
              <li>
                Equipment insurance may be provided by Pro-DJ for company
                equipment
              </li>
              <li>Auto insurance required for equipment transportation</li>
              <li>
                Workers compensation is the responsibility of the subcontractor
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. Confidentiality and Non-Compete
            </h2>
            <p className="text-gray-300 mb-4">Subcontractor agrees to:</p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>
                Maintain confidentiality of client information and business
                practices
              </li>
              <li>
                Not solicit Pro-DJ clients for independent services during
                contract term
              </li>
              <li>
                Not use Pro-DJ branding or materials for personal business
              </li>
              <li>6-month non-compete period after contract termination</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="text-gray-300 mb-4">
              This agreement may be terminated:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>By either party with 30 days written notice</li>
              <li>Immediately for breach of contract or poor performance</li>
              <li>
                For failure to maintain required certifications or insurance
              </li>
              <li>For violation of brand standards or client complaints</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              11. Tax Responsibilities
            </h2>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-red-400">
                  Important Tax Information
                </span>
              </div>
              <p className="text-sm text-gray-300">
                As an independent contractor, you are responsible for all tax
                obligations, including quarterly estimated tax payments.
              </p>
            </div>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>Submit completed W-9 form before first payment</li>
              <li>Receive 1099-NEC for annual earnings over $600</li>
              <li>Responsible for federal, state, and local income taxes</li>
              <li>
                Responsible for self-employment tax (Social Security and
                Medicare)
              </li>
              <li>May need to make quarterly estimated tax payments</li>
              <li>Consult with a tax professional for guidance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              12. Contact and Dispute Resolution
            </h2>
            <p className="text-gray-300 mb-4">
              For questions about this agreement or to report issues, contact
              Pro-DJ through:
            </p>
            <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 mb-4">
              <li>Admin dashboard support system</li>
              <li>Email: contractors@bookprodj.com</li>
              <li>Emergency hotline for event-day issues</li>
            </ul>
            <p className="text-gray-300 mb-4">
              Disputes will be resolved through binding arbitration in
              accordance with applicable state laws.
            </p>
          </section>

          <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Agreement Acknowledgment
            </h3>
            <p className="text-gray-300 text-center mb-4">
              By signing this agreement electronically, you acknowledge that you
              have read, understood, and agree to all terms and conditions
              outlined above.
            </p>
            <div className="text-center">
              <Link
                href="/legal"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Return to Legal Documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
