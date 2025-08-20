"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Menu,
  X,
  User,
  Settings,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  BookOpen,
  Gavel,
  Phone,
  Building,
} from "lucide-react";
import Link from "next/link";

export default function HamburgerMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close menu when route changes
  useEffect(() => {
    if (isOpen) {
      handleCloseMenu();
    }
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleOpenMenu = () => {
    setIsOpen(true);
    // Small delay to ensure the element is rendered before animating
    setTimeout(() => {
      setIsAnimating(true);
    }, 10);
  };

  const handleCloseMenu = () => {
    setIsAnimating(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const menuItems = [
    {
      title: "Account Management",
      href: "/dashboard/account",
      icon: Settings,
      description: "Manage your account settings",
    },
    {
      title: "Edit Profile",
      href: "/dashboard/profile",
      icon: User,
      description: "Update your profile information",
    },
    {
      title: "View Bookings",
      href: "/dashboard/bookings",
      icon: BookOpen,
      description: "Check your booking history",
    },
  ];

  const legalItems = [
    {
      title: "Terms of Service",
      href: "/legal/terms",
      icon: FileText,
      description: "Read our terms and conditions",
    },
    {
      title: "Privacy Policy",
      href: "/legal/privacy",
      icon: Shield,
      description: "Learn about data protection",
    },
    {
      title: "Refund Policy",
      href: "/legal/refund",
      icon: Gavel,
      description: "Understand our refund process",
    },
    {
      title: "Contact Information",
      href: "/legal/contact",
      icon: Phone,
      description: "Get in touch with us",
    },
    {
      title: "Business License",
      href: "/legal/license",
      icon: Building,
      description: "View our business credentials",
    },
  ];

  return (
    <>
      {/* Menu Button - Positioned at far right */}
      <button
        onClick={handleOpenMenu}
        className="p-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Side Panel Menu */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999999] pointer-events-none">
            {/* Side Panel */}
            <div
              ref={menuRef}
              className={`absolute right-0 top-0 h-full w-80 bg-gray-800/60 backdrop-blur-sm border-l border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-[99999999] pointer-events-auto ${
                isAnimating ? "translate-x-0" : "translate-x-full"
              }`}
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: isAnimating ? "translateX(0)" : "translateX(100%)",
                transition: "transform 300ms ease-in-out",
                zIndex: "99999999 !important",
                position: "absolute !important",
              }}
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Menu</h2>
                    <button
                      onClick={handleCloseMenu}
                      className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    {/* Account Management Section */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Account
                      </h3>
                      <div className="space-y-1">
                        {menuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors group"
                            >
                              <Icon className="w-5 h-5 text-gray-400 group-hover:text-violet-400" />
                              <div className="flex-1">
                                <p className="font-medium">{item.title}</p>
                                <p className="text-xs text-gray-500">
                                  {item.description}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Legal Section */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Legal
                      </h3>
                      <div className="space-y-1">
                        {legalItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors group"
                            >
                              <Icon className="w-5 h-5 text-gray-400 group-hover:text-violet-400" />
                              <div className="flex-1">
                                <p className="font-medium">{item.title}</p>
                                <p className="text-xs text-gray-500">
                                  {item.description}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sign Out */}
                    <div className="pt-4 border-t border-gray-700">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors group"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
