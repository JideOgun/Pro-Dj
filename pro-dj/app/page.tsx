"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import styles from "./home.module.css";

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
              Jay Baba
            </h1>
            <div className="text-2xl md:text-3xl font-bold text-white mb-2">
              Professional DJ
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          {/* Personalized welcome message for logged-in users */}
          {session?.user && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 backdrop-blur-sm border border-violet-500/20 rounded-2xl p-6 max-w-2xl mx-auto">
                <p className="text-2xl text-violet-200 font-semibold mb-3">
                  Hello {userName}! 👋
                </p>
                <p className="text-lg text-gray-300">
                  Ready to book your next event? Let&apos;s make it
                  unforgettable with the perfect music and energy!
                </p>
              </div>
            </div>
          )}

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            <span className="text-violet-400 font-semibold">Afrobeats</span> •{" "}
            <span className="text-purple-400 font-semibold">Amapiano</span> •{" "}
            <span className="text-pink-400 font-semibold">
              High-energy club sets
            </span>
            <br />
            <span className="text-gray-400">
              Based in your city, ready for your event.
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          {/* Desktop hover menu */}
          <div className={styles.menu}>
            <a
              href="/book"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              🎵 Book Me
            </a>
            <div className={styles.dropdown} aria-label="Event types">
              <a className={styles.item} href="/book?type=Wedding">
                💒 Wedding
              </a>
              <a className={styles.item} href="/book?type=Club%20Night">
                🕺 Club Night
              </a>
              <a className={styles.item} href="/book?type=Corporate">
                🏢 Corporate
              </a>
              <a className={styles.item} href="/book?type=Birthday">
                🎂 Birthday
              </a>
              <a className={styles.item} href="/book?type=Private%20Party">
                🎉 Private Party
              </a>
            </div>
          </div>

          {/* Mobile dropdown */}
          <details className={styles.details}>
            <summary className={styles.summary}>
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                🎵 Book Me
              </span>
            </summary>
            <div className={styles.panel} aria-label="Event types">
              <a className={styles.menuItem} href="/book?type=Wedding">
                💒 Wedding
              </a>
              <a className={styles.menuItem} href="/book?type=Club%20Night">
                🕺 Club Night
              </a>
              <a className={styles.menuItem} href="/book?type=Corporate">
                🏢 Corporate
              </a>
              <a className={styles.menuItem} href="/book?type=Birthday">
                🎂 Birthday
              </a>
              <a className={styles.menuItem} href="/book?type=Private%20Party">
                🎉 Private Party
              </a>
              <a className={styles.menuItem} href="/book">
                📝 Just Book
              </a>
            </div>
          </details>

          <a
            href="/mixes"
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 hover:border-violet-500/50 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            🎧 Listen to Mixes
          </a>
          <a
            href="/posts"
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 hover:border-purple-500/50 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            📝 Read the Blog
          </a>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 text-center hover:border-violet-500/30 transition-all duration-300">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-bold text-white mb-2">Premium Music</h3>
            <p className="text-gray-400">
              Latest hits, classic tracks, and everything in between
            </p>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 text-center hover:border-purple-500/30 transition-all duration-300">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">High Energy</h3>
            <p className="text-gray-400">
              Keep your crowd moving with infectious beats
            </p>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 text-center hover:border-pink-500/30 transition-all duration-300">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
            <p className="text-gray-400">
              Reliable, punctual, and always ready to perform
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
