import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="bg-red-600/20 border border-red-500/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">You're Offline</h1>
          <p className="text-gray-400 mb-8">
            It looks like you've lost your internet connection. Don't worry -
            you can still access some features of Pro-DJ while offline.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What's Available Offline:</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Previously viewed DJ profiles</li>
              <li>• Cached event photos</li>
              <li>• Your booking history</li>
              <li>• Basic app navigation</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          <p>Pro-DJ works best with an internet connection</p>
        </div>
      </div>
    </div>
  );
}
