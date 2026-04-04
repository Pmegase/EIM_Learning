import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resource Store",
  description:
    "Browse professional development resources, training materials, and career tools curated by EIM Learning and Development Consult.",
  openGraph: {
    title: "Resource Store | EIM Consult",
    description: "Professional development resources and training materials by EIM Consult.",
    type: "website",
  },
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
