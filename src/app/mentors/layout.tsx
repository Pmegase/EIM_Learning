import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Mentors",
  description:
    "Connect with experienced mentors from across the globe. EIM Consult pairs students and young professionals with industry leaders for guidance and career growth.",
  keywords: ["mentors Africa", "mentorship program", "career mentoring", "professional guidance", "EIM mentors"],
  openGraph: {
    title: "Our Mentors | EIM Consult",
    description: "Connect with experienced mentors from across the globe for career guidance and growth.",
    type: "website",
  },
};

export default function MentorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
