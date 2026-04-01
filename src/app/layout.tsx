import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ContentProvider } from "@/contexts/ContentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BlogProvider } from "@/contexts/BlogContext";
import { NewsletterProvider } from "@/contexts/NewsletterContext";
import { NavigationProvider } from "@/contexts/NavigationContext";

export const metadata: Metadata = {
  title: "EIM Consult - Learning & Development",
  description: "E.I.M Learning and Development Consult - Management Consultancy",
  icons: {
    icon: "/uploads/logo.png",
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
