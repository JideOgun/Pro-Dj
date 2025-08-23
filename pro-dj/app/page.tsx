"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Star,
  Award,
  Users,
  Calendar,
  MapPin,
  Play,
  Heart,
  Eye,
} from "lucide-react";
import DjShowcase from "@/components/DjShowcase";
import PWAInfo from "@/components/PWAInfo";

export default function Home() {
  const { data: session } = useSession();
  const [displayName, setDisplayName] = useState<string>("there");

  useEffect(() => {
    if (session?.user?.id) {
      // Fetch user profile to get proper display name
      fetch(`/api/profile`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.data) {
            const user = data.data;
            // For DJs, prioritize stage name
            if (user.role === "DJ" && user.djProfile?.stageName) {
              setDisplayName(user.djProfile.stageName);
            } else if (user.role === "ADMIN" && user.djProfile?.stageName) {
              // For admins who are also DJs, use stage name
              setDisplayName(user.djProfile.stageName);
            } else {
              // Fallback to name or email
              setDisplayName(user.name || user.email.split("@")[0] || "there");
            }
          }
        })
        .catch(() => {
          // Fallback to session data
          setDisplayName(
            session.user.name || session.user.email?.split("@")[0] || "there"
          );
        });
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-pink-500/8 rounded-full blur-3xl animate-pulse delay-1500"></div>
      </div>

      <main className="relative z-10">
        {/* PWA Info Section - FIRST THING AFTER NAVBAR */}
        <PWAInfo />

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 md:py-32">
          <div className="text-center mb-20">
            {/* Enhanced Main Title */}
            <div className="mb-12">
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 animate-pulse">
                Pro-DJ
              </h1>
              <div className="text-3xl md:text-4xl font-bold text-white mb-4">
                Multi-DJ Booking Platform
              </div>
              <div className="w-32 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 mx-auto rounded-full shadow-lg"></div>
            </div>

            {/* Enhanced Personalized welcome message */}
            {session?.user && (
              <div className="mb-12">
                <div className="bg-gradient-to-r from-violet-900/40 to-purple-900/40 backdrop-blur-md border border-violet-500/30 rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl">
                  <p className="text-3xl text-violet-200 font-bold mb-4">
                    Welcome back, {displayName}! 👋
                  </p>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    {session.user.role === "CLIENT"
                      ? "Ready to book your next event? Browse our talented DJs and find the perfect match!"
                      : session.user.role === "DJ"
                      ? "Manage your bookings and grow your business with our platform!"
                      : "Manage the platform and oversee all bookings and DJs."}
                  </p>
                </div>
              </div>
            )}

            {/* Enhanced Tagline */}
            <div className="mb-12">
              <p className="text-2xl md:text-3xl text-gray-300 max-w-5xl mx-auto leading-relaxed mb-6">
                <span className="text-violet-400 font-bold">
                  Find the perfect DJ
                </span>{" "}
                for your event •{" "}
                <span className="text-purple-400 font-bold">
                  Multiple genres
                </span>{" "}
                •{" "}
                <span className="text-pink-400 font-bold">
                  Professional service
                </span>
              </p>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                From weddings to corporate events, we&apos;ve got you covered
                with the best DJs in the industry.
              </p>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            {session?.user ? (
              // Logged in user actions
              <div className="flex flex-col sm:flex-row gap-6">
                {session.user.role === "CLIENT" && (
                  <>
                    <Link
                      href="/book"
                      className="group bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-violet-500/25 transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      <Music className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                      Book a DJ
                      <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/dashboard/client"
                      className="bg-gray-800/60 backdrop-blur-md border border-gray-600/40 hover:border-violet-500/60 text-white font-semibold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      <ClipboardList className="w-6 h-6 mr-3" />
                      My Bookings
                    </Link>
                  </>
                )}
                {session.user.role === "DJ" && (
                  <>
                    <Link
                      href="/dashboard/dj"
                      className="group bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-violet-500/25 transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      <Headphones className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                      DJ Dashboard
                      <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/dashboard/bookings"
                      className="bg-gray-800/60 backdrop-blur-md border border-gray-600/40 hover:border-violet-500/60 text-white font-semibold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      <ClipboardList className="w-6 h-6 mr-3" />
                      View Bookings
                    </Link>
                  </>
                )}
                {session.user.role === "ADMIN" && (
                  <>
                    <Link
                      href="/dashboard/admin"
                      className="group bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-violet-500/25 transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      <Settings className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                      Admin Dashboard
                      <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/dashboard/users"
                      className="bg-gray-800/60 backdrop-blur-md border border-gray-600/40 hover:border-violet-500/60 text-white font-semibold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      <ClipboardList className="w-6 h-6 mr-3" />
                      Manage Users
                    </Link>
                  </>
                )}
              </div>
            ) : (
              // Non-logged in user actions
              <>
                <Link
                  href="/auth"
                  className="group bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-violet-500/25 transform hover:scale-105 transition-all duration-300 flex items-center"
                >
                  Get Started
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/djs"
                  className="bg-gray-800/60 backdrop-blur-md border border-gray-600/40 hover:border-violet-500/60 text-white font-semibold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                >
                  <Users className="w-6 h-6 mr-3" />
                  Browse DJs
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Enhanced DJ Showcase Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Featured DJs
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover talented DJs for your next event. Each DJ brings their
              unique style and expertise to create unforgettable experiences.
            </p>
          </div>

          <DjShowcase
            title=""
            subtitle=""
            limit={6}
            featured={true}
            showViewAll={true}
          />

          {/* Call to Action for Non-logged in users */}
          {!session?.user && (
            <div className="text-center mt-12">
              <p className="text-lg text-gray-300 mb-6">
                Ready to book your perfect DJ? Create an account to get started!
              </p>
              <Link
                href="/auth"
                className="group inline-flex items-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-2xl hover:shadow-violet-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <Music className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Sign Up to Book
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </section>

        {/* Enhanced Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Pro-DJ?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the difference with our professional DJ booking
              platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            <div className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md border border-gray-700/40 rounded-3xl p-8 text-center hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-500 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Music className="w-10 h-10 text-violet-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Multiple DJs
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Choose from a diverse selection of professional DJs with
                different styles and genres
              </p>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md border border-gray-700/40 rounded-3xl p-8 text-center hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Zap className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Easy Booking
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Simple booking process with instant confirmation and secure
                payment processing
              </p>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md border border-gray-700/40 rounded-3xl p-8 text-center hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Target className="w-10 h-10 text-pink-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Secure Payments
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Safe and secure payment processing with transparent pricing and
                no hidden fees
              </p>
            </div>
          </div>
        </section>

        {/* Enhanced Gallery Preview Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Event Gallery
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Explore amazing moments from our DJ performances across various
              events and celebrations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/gallery"
                className="group inline-flex items-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-violet-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <Camera className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                View Gallery
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>

              {!session?.user && (
                <Link
                  href="/auth"
                  className="group inline-flex items-center bg-gray-800/60 backdrop-blur-md border border-gray-600/40 hover:border-violet-500/60 text-white font-semibold py-5 px-10 rounded-2xl text-xl shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Users className="w-6 h-6 mr-3" />
                  Join to Upload
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Enhanced Call to Action for DJs */}
        {!session?.user && (
          <section className="container mx-auto px-6 py-20">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-md border border-blue-500/30 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                  <Headphones className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">
                  Are you a DJ? Join our platform!
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Join our platform and start getting booked for events. Manage
                  your schedule, set your rates, and grow your business with our
                  professional booking system.
                </p>
                <Link
                  href="/auth"
                  className="group inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                >
                  Become a DJ
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
