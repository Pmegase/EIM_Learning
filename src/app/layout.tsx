import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ContentProvider } from "@/contexts/ContentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BlogProvider } from "@/contexts/BlogContext";
import { NewsletterProvider } from "@/contexts/NewsletterContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import JsonLd from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.eimconsultld.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EIM Consult - Learning & Development",
    template: "%s | EIM Consult",
  },
  description:
    "E.I.M Learning and Development Consult is a management consultancy bridging the gap between employers and students across Africa through mentorship, internships, and professional training.",
  keywords: [
    "EIM Consult",
    "learning and development",
    "management consultancy",
    "mentorship Africa",
    "internship program",
    "professional training",
    "student development",
    "career development Africa",
    "corporate training",
  ],
  authors: [{ name: "EIM Learning and Development Consult" }],
  creator: "EIM Consult",
  publisher: "EIM Learning and Development Consult",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "EIM Consult",
    title: "EIM Consult - Learning & Development",
    description:
      "Bridging the gap between employers and students across Africa through mentorship, internships, and professional training.",
    images: [
      {
        url: "/uploads/hero-bg.png",
        width: 1200,
        height: 630,
        alt: "EIM Learning and Development Consult",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EIM Consult - Learning & Development",
    description:
      "Bridging the gap between employers and students across Africa through mentorship, internships, and professional training.",
    images: ["/uploads/hero-bg.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/uploads/logo.png",
    apple: "/uploads/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "EIM Learning and Development Consult",
            alternateName: "EIM Consult",
            url: SITE_URL,
            logo: `${SITE_URL}/uploads/logo.png`,
            description:
              "Management consultancy bridging the gap between employers and students across Africa through mentorship, internships, and professional training.",
            sameAs: [
              "https://www.instagram.com/eimldconsult",
              "https://www.facebook.com/EIM-learning-and-development-Consult",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              email: "eimconsultld@gmail.com",
              contactType: "customer service",
            },
          }}
        />
        <ContentProvider>
          <BlogProvider>
            <NewsletterProvider>
              <AuthProvider>
                <NavigationProvider>
                  {children}
                  <Toaster />
                </NavigationProvider>
              </AuthProvider>
            </NewsletterProvider>
          </BlogProvider>
        </ContentProvider>
      </body>
    </html>
  );
}
