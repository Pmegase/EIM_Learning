import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Attend workshops, training sessions, mentorship events, and professional development programs organized by EIM Learning and Development Consult.",
  keywords: ["events Africa", "workshops", "professional training events", "mentorship events", "EIM events"],
  openGraph: {
    title: "Events | EIM Consult",
    description: "Workshops, training sessions, and professional development events by EIM Consult.",
    type: "website",
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
