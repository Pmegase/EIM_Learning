import type { Metadata } from "next";
import BlogPageClient from "./_components/BlogPageClient";

export const metadata: Metadata = {
  title: "Blog | EIM Consultancy",
  description:
    "Insights, tips, and stories about mentorship, career development, and professional growth in Africa.",
  openGraph: {
    title: "Blog | EIM Consultancy",
    description:
      "Insights, tips, and stories about mentorship, career development, and professional growth in Africa.",
    url: "https://eimconsult.com/blog",
    siteName: "EIM Consultancy",
    type: "website",
  },
  alternates: {
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
