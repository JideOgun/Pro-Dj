import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  FileText,
  Building,
  Users,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Contact Information</h1>
          <p className="text-gray-400">Get in touch with the Pro-DJ team</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">General Support</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">support@pro-dj.com</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="text-white">+1 (555) 123-4567</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Response Time</p>
                  <p className="text-white">Within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Technical Support</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">tech@pro-dj.com</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Priority</p>
                  <p className="text-white">High priority issues</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Business Inquiries</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">business@pro-dj.com</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Partnerships</p>
                  <p className="text-white">partnerships@pro-dj.com</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Legal & Privacy</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Legal</p>
                  <p className="text-white">legal@pro-dj.com</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Privacy</p>
                  <p className="text-white">privacy@pro-dj.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Office Hours</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Customer Support</h3>
              <p className="text-gray-300">
                Monday - Friday: 9:00 AM - 6:00 PM EST
              </p>
              <p className="text-gray-300">Saturday: 10:00 AM - 4:00 PM EST</p>
              <p className="text-gray-300">Sunday: Closed</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Emergency Support</h3>
              <p className="text-gray-300">24/7 for urgent booking issues</p>
              <p className="text-gray-300">Email: emergency@pro-dj.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
