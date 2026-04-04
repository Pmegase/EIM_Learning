import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Openings",
  description:
    "Explore job opportunities, internships, and career openings posted by EIM Consult partners. Find roles in management, consulting, and professional development across Africa.",
  keywords: ["jobs Africa", "internship opportunities", "career openings", "management jobs", "EIM Consult jobs"],
  openGraph: {
    title: "Job Openings | EIM Consult",
    description: "Explore job opportunities and internships posted by EIM Consult partners across Africa.",
    type: "website",
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
