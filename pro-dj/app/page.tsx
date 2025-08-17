"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Music,
  ClipboardList,
  Headphones,
  ArrowRight,
  Target,
  Settings,
  Lock,
  Zap,
  Camera,
} from "lucide-react";
import DjShowcase from "@/components/DjShowcase";

export default function Home() {
  const { data: session } = useSession();
  const userName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <main className="relative z-10 container mx-auto px-6 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* Main Title with Animation */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Pro-DJ
            </h1>
            <div className="text-2xl md:text-3xl font-bold text-white mb-2">
              Multi-DJ Booking Platform
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          {/* Personalized welcome message for logged-in users */}
          {session?.user && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 backdrop-blur-sm border border-violet-500/20 rounded-2xl p-6 max-w-2xl mx-auto">
                <p className="text-2xl text-violet-200 font-semibold mb-3">
                  Welcome back, {userName}! 👋
                </p>
                <p className="text-lg text-gray-300">
                  {session.user.role === "CLIENT"
                    ? "Ready to book your next event? Browse our talented DJs and find the perfect match!"
                    : session.user.role === "DJ"
                    ? "Manage your bookings and grow your business with our platform!"
                    : "Manage the platform and oversee all bookings and DJs."}
                </p>
              </div>
            </div>
          )}

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
            <span className="text-violet-400 font-semibold">
              Find the perfect DJ
            </span>{" "}
            for your event •{" "}
            <span className="text-purple-400 font-semibold">
              Multiple genres
            </span>{" "}
            •{" "}
            <span className="text-pink-400 font-semibold">
              Professional service
            </span>
            <br />
            <span className="text-gray-400">
              From weddings to corporate events, we&apos;ve got you covered.
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          {session?.user ? (
            // Logged in user actions
            <div className="flex flex-col sm:flex-row gap-4">
              {session.user.role === "CLIENT" && (
                <>
                  <Link
                    href="/book"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Music className="w-5 h-5 inline mr-2" />
                    Book a DJ
                  </Link>
                  <Link
                    href="/dashboard/client"
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 hover:border-violet-500/50 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <ClipboardList className="w-5 h-5 inline mr-2" />
                    My Bookings
                  </Link>
                </>
              )}
              {session.user.role !== "CLIENT" && (
                <div className="text-center">
                  <p className="text-gray-400 mb-4">
                    Booking is only available for client accounts
                  </p>
                </div>
              )}
              {session.user.role === "DJ" && (
                <>
                  <Link
                    href="/dashboard/dj"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Headphones className="w-5 h-5 inline mr-2" />
                    DJ Dashboard
                  </Link>
                  <Link
                    href="/dashboard/bookings"
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 hover:border-violet-500/50 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <ClipboardList className="w-5 h-5 inline mr-2" />
                    My Bookings
                  </Link>
                </>
              )}
              {session.user.role === "ADMIN" && (
                <>
                  <Link
                    href="/dashboard/admin"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Settings className="w-5 h-5 inline mr-2" />
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/dashboard/bookings"
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 hover:border-violet-500/50 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <ClipboardList className="w-5 h-5 inline mr-2" />
                    All Bookings
                  </Link>
                </>
              )}
            </div>
          ) : (
            // Guest user actions
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/book"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Music className="w-5 h-5 inline mr-2" />
                Book a DJ
              </Link>
              <Link
                href="/auth"
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 hover:border-violet-500/50 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Lock className="w-5 h-5 inline mr-2" />
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 text-center hover:border-violet-500/30 transition-all duration-300">
            <Music className="w-12 h-12 mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-white mb-2">Multiple DJs</h3>
            <p className="text-gray-400">
              Choose from a diverse selection of professional DJs
            </p>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 text-center hover:border-purple-500/30 transition-all duration-300">
            <Zap className="w-12 h-12 mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-white mb-2">Easy Booking</h3>
            <p className="text-gray-400">
              Simple booking process with instant confirmation
            </p>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 text-center hover:border-pink-500/30 transition-all duration-300">
            <Target className="w-12 h-12 mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-white mb-2">
              Secure Payments
            </h3>
            <p className="text-gray-400">
              Safe and secure payment processing for all bookings
            </p>
          </div>
        </div>

        {/* Gallery Preview Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Event Gallery
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Explore amazing moments from our DJ performances across various
            events
          </p>
          <Link
            href="/gallery"
            className="inline-flex items-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Camera className="w-5 h-5 mr-2" />
            View Gallery
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>

        {/* DJ Showcase Section */}
        <DjShowcase
          title="Featured DJs"
          subtitle="Discover talented DJs for your next event"
          limit={6}
          featured={true}
          showViewAll={true}
        />

        {/* Call to Action for DJs */}
        {!session?.user && (
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">
                Are you a DJ? <Headphones className="w-6 h-6 inline ml-2" />
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                Join our platform and start getting booked for events. Manage
                your schedule, set your rates, and grow your business.
              </p>
              <Link
                href="/dj/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Become a DJ
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
