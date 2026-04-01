"use client"

import React, { useState } from "react";
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut } from "lucide-react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { navigateToSection, activeSection } = useNavigation();
  const { isAuthenticated, isLoading, role, logout } = useAuth();
  const pathname = usePathname();

  const handleNav = (section: string) => {
    navigateToSection(section);
    setIsMenuOpen(false);
  };

  const homeSections = ["home", "services", "about", "gallery", "contact"];
  const pageLinks = [
    { href: "/events", label: "Events" },
    { href: "/jobs", label: "Jobs" },
    { href: "/mentors", label: "Mentors" },
    { href: "/store", label: "Store" },
    { href: "/blog", label: "Blog" },
  ];

  const isSectionActive = (section: string) => {
    return pathname === "/" && activeSection === section;
  };

  const isPageActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const baseLinkClass = "transition-colors";
  const activeClass = "text-green-600 font-semibold";
  const inactiveClass = "text-gray-700 hover:text-green-600";

  return (
    <header className="fixed top-0 w-full bg-white shadow-md z-50">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/uploads/logo.png"
              alt="EIM Consultancy"
              width={48}
              height={48}
              className="h-12 w-auto cursor-pointer"
              onClick={() => handleNav("home")}
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {homeSections.map((section) => (
              <button
                key={section}
                onClick={() => handleNav(section)}
                className={`${baseLinkClass} capitalize ${
                  isSectionActive(section) ? activeClass : inactiveClass
                }`}
              >
                {section}
              </button>
            ))}
            {pageLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${baseLinkClass} ${
                  isPageActive(link.href) ? activeClass : inactiveClass
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth Buttons */}
            {!isLoading && (
              isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href={role === "admin" ? "/admin/dashboard" : "/dashboard"}
                    className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-800 font-medium transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-gray-700 hover:text-green-600 font-medium transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              {homeSections.map((section) => (
                <button
                  key={section}
                  onClick={() => handleNav(section)}
                  className={`${baseLinkClass} text-left capitalize ${
                    isSectionActive(section) ? activeClass : inactiveClass
                  }`}
                >
                  {section}
                </button>
              ))}
              {pageLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`${baseLinkClass} text-left ${
                    isPageActive(link.href) ? activeClass : inactiveClass
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Auth Links */}
              {!isLoading && (
                <>
                  <hr className="border-gray-200" />
                  {isAuthenticated ? (
                    <>
                      <Link
                        href={role === "admin" ? "/admin/dashboard" : "/dashboard"}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => { logout(); setIsMenuOpen(false); }}
                        className="flex items-center gap-2 text-gray-700 hover:text-red-600 text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                      >
                        <LogIn className="h-4 w-4" />
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium"
                      >
                        <UserPlus className="h-4 w-4" />
                        Sign Up
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
