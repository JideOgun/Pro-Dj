import Link from "next/link";
import { Home, Search, Headphones } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <Headphones className="w-24 h-24 mx-auto text-purple-500 mb-4" />
          <h1 className="text-6xl font-bold text-purple-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-gray-400 mb-8">
            The page you're looking for doesn't exist. Maybe it got lost in the
            mix?
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>

          <Link
            href="/djs"
            className="inline-flex items-center justify-center w-full px-6 py-3 border border-purple-600 text-purple-400 font-medium rounded-lg hover:bg-purple-600 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5 mr-2" />
            Browse DJs
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Need help? Contact us at support@prodj.com</p>
        </div>
      </div>
    </div>
  );
}
