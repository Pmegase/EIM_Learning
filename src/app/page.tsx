"use client"

import { NavigationProvider } from "@/contexts/NavigationContext";
import { useContent } from "@/contexts/ContentContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Gallery from "@/components/Gallery";
import BlogSection from "@/components/BlogSection";
import NewsletterSignup from "@/components/NewsletterSignup";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  const { isContentLoading } = useContent();

  return (
    <NavigationProvider>
      <Header />
      {isContentLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <Hero />
          <Services />
          <About />
          <Gallery />
          <BlogSection />
          <NewsletterSignup />
          <Contact />
          <Footer />
        </>
      )}
    </NavigationProvider>
  );
}
