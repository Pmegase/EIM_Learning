import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about EIM Consult programs, mentorship, internships, and professional development services.",
  openGraph: {
    title: "FAQ | EIM Consult",
    description: "Find answers to common questions about EIM Consult programs and services.",
    type: "website",
  },
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Who does EIM Consultancy work with?", acceptedAnswer: { "@type": "Answer", text: "EIM works with corporate institutions looking for qualified interns and junior-level staff and students, young professionals, and recent graduates in need of career guidance and employability skills training." } },
    { "@type": "Question", name: "How often do you organize the Mentorship Program?", acceptedAnswer: { "@type": "Answer", text: "Currently, the Mentorship Program is held twice a year." } },
    { "@type": "Question", name: "Who can attend your training & mentorship programs?", acceptedAnswer: { "@type": "Answer", text: "Our workshops & programs are held mainly for students, graduates, and young professionals." } },
    { "@type": "Question", name: "How many weeks will the mentorship program take?", acceptedAnswer: { "@type": "Answer", text: "The Mentorship Program is for six (6) weeks." } },
    { "@type": "Question", name: "How much does the Mentorship Program cost?", acceptedAnswer: { "@type": "Answer", text: "The program is not paid for — it is done for free." } },
    { "@type": "Question", name: "How can I sign up with EIM?", acceptedAnswer: { "@type": "Answer", text: "Please send us an email via eimconsultld@gmail.com stating which of our programs you want to sign up for." } },
  ],
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={faqStructuredData} />
      {children}
    </>
  );
}
