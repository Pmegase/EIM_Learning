"use client"

import React from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import Link from "next/link";

const Footer = () => {
  const { navigateToSection } = useNavigation();

  return (
    <footer className="bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center border-b border-gray-200 pb-6 mb-6 md:pb-8 md:mb-8">
          {["home", "services", "about", "gallery", "contact"].map((section) => (
            <button
              key={section}
              onClick={() => navigateToSection(section)}
              className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors capitalize"
            >
              {section}
            </button>
          ))}
          <Link href="/events" className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors">
            Events
          </Link>
          <Link href="/jobs" className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors">
            Jobs
          </Link>
          <Link href="/mentors" className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors">
            Mentors
          </Link>
          <Link href="/store" className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors">
            Store
          </Link>
          <Link href="/blog" className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors">
            Blog
          </Link>
          <Link href="/faq" className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors">
            FAQ
          </Link>
        </div>
        <p className="text-center text-gray-600">
          &copy; {new Date().getFullYear()} EIM Consultancy. All rights reserved.
        </p>
        <p className="text-center text-gray-400 text-sm mt-2">
          Developed by{" "}
          <a
            href="https://kwabenaoseitutu.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800 font-medium transition-colors"
          >
            KOT
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
