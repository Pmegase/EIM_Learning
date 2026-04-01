"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface NavigationContextType {
  navigateToSection: (sectionId: string) => void;
  activeSection: string;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("home");

  const navigateToSection = (sectionId: string) => {
    if (pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(`/#${sectionId}`);
    }
  };

  // Scroll spy for homepage sections
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = ["home", "services", "about", "gallery", "contact"];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const aIdx = sections.indexOf(a.target.id);
            const bIdx = sections.indexOf(b.target.id);
            return aIdx - bIdx;
          });
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  // Set active based on pathname for non-homepage routes
  useEffect(() => {
    if (pathname === "/") return;
    // Strip leading slash and take first segment
    const segment = pathname.split("/")[1];
    setActiveSection(segment || "home");
  }, [pathname]);

  return (
    <NavigationContext.Provider value={{ navigateToSection, activeSection }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
