"use client"

import { NavigationProvider } from "@/contexts/NavigationContext";
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
  return (
    <NavigationProvider>
      <Header />
      <Hero />
      <Services />
      <About />
      <Gallery />
      <BlogSection />
      <NewsletterSignup />
      <Contact />
      <Footer />
    </NavigationProvider>
  );
}
