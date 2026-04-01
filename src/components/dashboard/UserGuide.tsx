"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserRole } from "@/types";
import {
  BookOpen, ChevronDown, ChevronUp, User, Upload, FileText, Award,
  MessageCircle, Briefcase, Search, Building, Users, ShieldCheck,
  Heart, Settings, BarChart3, Mail, ShoppingBag, Eye, Pencil,
  CheckCircle, Ban, KeyRound, Globe, GraduationCap,
} from "lucide-react";

interface GuideSection {
  icon: React.ReactNode;
  title: string;
  steps: string[];
}

const GUIDES: Record<string, { intro: string; sections: GuideSection[] }> = {
  intern: {
    intro: "Welcome to your student dashboard! Here you can manage your profile, upload documents, apply for jobs, and connect with mentors.",
    sections: [
      {
        icon: <User className="h-4 w-4 text-green-600" />,
        title: "Complete Your Profile",
        steps: [
          "Click \"Edit Profile\" on your profile card at the top of the dashboard.",
          "Add your headline (e.g. \"Computer Science Student | Aspiring Developer\").",
          "Fill in your education details: university, field of study, and graduation year.",
          "Add your skills and interests using the tag inputs — type and press Enter.",
          "Include your LinkedIn, portfolio, and GitHub links to stand out.",
          "Write a brief bio about yourself.",
          "Click the camera icon on your avatar to upload a profile picture.",
        ],
      },
      {
        icon: <Upload className="h-4 w-4 text-blue-600" />,
        title: "Upload Your CV",
        steps: [
          "Find the \"My CV\" card on your dashboard.",
          "Click \"Upload CV (PDF)\" and select your CV file (PDF only, max 10MB).",
          "Your CV will be stored securely and can be used when applying to jobs.",
          "You can replace or delete your CV at any time.",
          "If you have an active mentor, they will NOT see your CV unless you share it.",
        ],
      },
      {
        icon: <Award className="h-4 w-4 text-amber-600" />,
        title: "Upload Certificates",
        steps: [
          "Find the \"My Certificates\" card on your dashboard.",
          "Click \"Add\" to upload a new certificate.",
          "Give it a descriptive name (e.g. \"AWS Solutions Architect\").",
          "Select the PDF file and click \"Upload Certificate\".",
          "You can upload multiple certificates — they appear as a list you can view or delete.",
        ],
      },
      {
        icon: <Heart className="h-4 w-4 text-pink-600" />,
        title: "Find and Request a Mentor",
        steps: [
          "Navigate to the \"Mentors\" page from the header menu.",
          "Browse available mentors — view their expertise, competencies, and availability.",
          "Click on a mentor to see their full profile.",
          "Click \"Request Mentorship\" and fill in your message, goals, and preferred schedule.",
          "Wait for the mentor to accept your request — you'll see the status on their profile.",
          "Once accepted, a \"My Mentor\" card appears on your dashboard with a Chat button.",
        ],
      },
      {
        icon: <MessageCircle className="h-4 w-4 text-green-600" />,
        title: "Chat with Your Mentor",
        steps: [
          "Once your mentorship is active, the \"My Mentor\" card appears on your dashboard.",
          "Click \"Chat\" to open the messaging window.",
          "Messages are delivered in real-time — your mentor gets an email notification too.",
          "The unread badge shows how many new messages you have.",
        ],
      },
      {
        icon: <Briefcase className="h-4 w-4 text-indigo-600" />,
        title: "Apply for Jobs",
        steps: [
          "Navigate to the \"Jobs\" page from the header menu.",
          "Use filters to search by industry, job type, experience level, and location.",
          "Click on a job to view the full description, requirements, and company info.",
          "Click \"Apply\" and fill in the application form.",
          "If you've uploaded a CV, it will be auto-attached — or you can upload a different one.",
          "Track your applications in the \"My Applications\" card on your dashboard.",
          "Application statuses: Submitted → Under Review → Shortlisted → Interview → Offered.",
        ],
      },
      {
        icon: <ShoppingBag className="h-4 w-4 text-orange-600" />,
        title: "Browse the Store",
        steps: [
          "Visit the \"Store\" page from the header menu.",
          "Browse merchandise, resources, and free items.",
          "Click \"Buy Now\" to be redirected to the external purchase platform.",
          "Free items show pickup location and instructions.",
        ],
      },
    ],
  },
  alumni: {
    intro: "Welcome back, alumni! Your dashboard works just like the student dashboard — manage your profile, documents, mentorship, and job applications.",
    sections: [], // Same as intern, will fall back
  },
  mentor: {
    intro: "Welcome to your mentor dashboard! Here you can manage your mentor profile, review mentorship requests, chat with mentees, and view their profiles.",
    sections: [
      {
        icon: <FileText className="h-4 w-4 text-green-600" />,
        title: "Manage Your Mentor Profile",
        steps: [
          "Your \"Mentor Profile\" card shows your application status and all details you submitted.",
          "Click \"View Details\" to expand and see your full profile.",
          "Click \"Edit\" to update your personal information, competencies, or mentorship preferences.",
          "Changes are saved immediately — your public mentor page updates automatically.",
          "Click the camera icon on your avatar to upload a profile picture.",
        ],
      },
      {
        icon: <Users className="h-4 w-4 text-blue-600" />,
        title: "Review Mentorship Requests",
        steps: [
          "The \"Mentorship Requests\" card shows all incoming requests from students.",
          "A red badge shows the number of pending requests.",
          "Use the filter tabs (All, Pending, Active, Completed, Declined) to find specific requests.",
          "Click on a request to expand and see the student's message, goals, and preferred schedule.",
          "Click \"View Profile\" to see the student's public profile (education, skills, interests).",
          "Click \"Accept\" to start the mentorship or \"Decline\" to reject it.",
        ],
      },
      {
        icon: <MessageCircle className="h-4 w-4 text-green-600" />,
        title: "Chat with Mentees",
        steps: [
          "Once you accept a request, a \"Chat\" button appears on that mentorship.",
          "Click \"Chat\" to open the messaging window with that mentee.",
          "Messages are delivered in real-time — the mentee gets an email notification.",
          "You can also see all your active mentees in the \"Active Mentees\" card.",
          "Click \"View Profile\" on any mentee to see their public profile.",
        ],
      },
      {
        icon: <CheckCircle className="h-4 w-4 text-gray-600" />,
        title: "Complete a Mentorship",
        steps: [
          "When a mentorship has run its course, expand the active request.",
          "Click \"Mark Complete\" to end the mentorship.",
          "Completed mentorships are archived and visible under the \"Completed\" filter.",
        ],
      },
    ],
  },
  corporate: {
    intro: "Welcome to your corporate dashboard! Set up your company profile, post jobs, and review applications from candidates.",
    sections: [
      {
        icon: <Building className="h-4 w-4 text-blue-600" />,
        title: "Set Up Your Company",
        steps: [
          "If you haven't registered your company yet, click \"Set Up Company\" on your dashboard.",
          "Complete the 3-step form: Basic Information → Company Details → About & Culture.",
          "Add your company name, industry, type, size, founded year, and tagline.",
          "Include your website, headquarters, contact info, and social media links.",
          "Write a compelling \"About\" section describing your company culture and mission.",
          "Add specialties to highlight your areas of expertise.",
          "Submit for review — an administrator will approve your company profile.",
        ],
      },
      {
        icon: <Eye className="h-4 w-4 text-green-600" />,
        title: "Manage Your Company Profile",
        steps: [
          "Once your company is set up, your profile card shows the current status.",
          "Pending: Your company is under review by an administrator.",
          "Approved: Your company is active — you can now post jobs!",
          "Click \"Edit\" to update any company details at any time.",
        ],
      },
      {
        icon: <Briefcase className="h-4 w-4 text-indigo-600" />,
        title: "Post Jobs",
        steps: [
          "Your company must be approved before you can post jobs.",
          "In the \"Job Postings\" card, click \"Post Job\".",
          "Fill in: title, description, requirements, responsibilities.",
          "Set job type (full-time, part-time, internship, etc.), experience level, and industry.",
          "Optionally add salary range, deadline, location, and remote status.",
          "Set status to \"Published\" to make it visible on the public job board, or \"Draft\" to save for later.",
          "You can edit or delete your jobs at any time.",
        ],
      },
      {
        icon: <Users className="h-4 w-4 text-purple-600" />,
        title: "Review Applications",
        steps: [
          "The \"Applications\" card shows all applications for your company's jobs.",
          "Use filter tabs to sort by status: Submitted, Reviewing, Shortlisted, Interview, Offered, Rejected.",
          "Click on an application to expand and see the candidate's cover letter, contact info, and links.",
          "Click \"View Profile\" to see the candidate's public profile.",
          "Use the action buttons to move candidates through the pipeline:",
          "  Submitted → Review → Shortlist → Schedule Interview → Offer (or Reject at any stage).",
        ],
      },
    ],
  },
  admin: {
    intro: "Welcome, administrator! You have full control over the platform — manage users, content, jobs, events, mentorships, store, and more.",
    sections: [
      {
        icon: <Settings className="h-4 w-4 text-gray-600" />,
        title: "Admin Dashboard CMS",
        steps: [
          "Access the admin dashboard from the top-right \"Admin\" link.",
          "The dashboard has tabs for: Hero, About, Services, Management, Gallery, Contact, Blog, Newsletter, Mentors, Store, Settings, Activity.",
          "Each tab lets you edit the corresponding section of the website.",
          "Click \"Save\" at the top to persist all CMS changes.",
        ],
      },
      {
        icon: <Users className="h-4 w-4 text-blue-600" />,
        title: "Manage Users",
        steps: [
          "Navigate to \"Users\" from the admin header to access the User Management page.",
          "View all users with stats: total, by role, suspended count.",
          "Search by name, filter by role or status (active/suspended).",
          "Click on a user to expand their details and access actions:",
          "  Change Role — select a new role from the dropdown.",
          "  Suspend / Activate — toggle account access.",
          "  Reset Password — sends a recovery email to the user.",
          "  Delete — permanently removes the account and all data.",
          "Click \"Export Excel\" to download all users as a spreadsheet.",
        ],
      },
      {
        icon: <Building className="h-4 w-4 text-indigo-600" />,
        title: "Approve Companies",
        steps: [
          "Go to \"Jobs\" in the admin header, then the \"Companies\" tab.",
          "Pending companies show Approve/Reject buttons.",
          "Approved companies can post jobs on the job board.",
          "You can also create companies directly from this page.",
        ],
      },
      {
        icon: <Heart className="h-4 w-4 text-pink-600" />,
        title: "Manage Mentorships",
        steps: [
          "Navigate to \"Mentorships\" from the admin header.",
          "Review pending mentor applications in the dashboard \"Mentors\" tab — approve or reject.",
          "The Mentorship Management page shows all mentor-mentee pairings.",
          "You can approve, decline, or complete any mentorship.",
        ],
      },
      {
        icon: <ShoppingBag className="h-4 w-4 text-orange-600" />,
        title: "Manage the Store",
        steps: [
          "Open the \"Store\" tab in the admin dashboard.",
          "Click \"Add Item\" to create a new product.",
          "Upload images, set title, description, category.",
          "For paid items: set price, currency, and purchase link (Amazon, AliExpress, etc.).",
          "For free items: toggle \"This item is free\" and add pickup location + instructions.",
          "Set status to \"Published\" to show on the public store page.",
        ],
      },
      {
        icon: <BarChart3 className="h-4 w-4 text-green-600" />,
        title: "Analytics & Activity",
        steps: [
          "Navigate to \"Analytics\" from the admin header for platform statistics.",
          "The \"Activity\" tab in the dashboard shows a paginated log of all admin and user actions.",
          "Filter by All, Admin, or User activity.",
        ],
      },
    ],
  },
};

interface Props {
  role: UserRole;
}

export default function UserGuide({ role }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<number | null>(null);

  // Alumni uses intern guide
  const guideRole = role === "alumni" ? "intern" : role;
  const guide = GUIDES[guideRole];
  if (!guide) return null;

  // Merge alumni intro with intern sections
  const intro = GUIDES[role]?.intro || guide.intro;
  const sections = guide.sections.length > 0 ? guide.sections : GUIDES.intern.sections;

  return (
    <Card className="border-green-200">
      <CardHeader
        className="cursor-pointer hover:bg-green-50/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            User Guide
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{intro}</p>

          <div className="space-y-1">
            {sections.map((section, i) => {
              const isSectionOpen = openSection === i;
              return (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenSection(isSectionOpen ? null : i)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {section.icon}
                      {section.title}
                    </span>
                    {isSectionOpen ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                  </button>
                  {isSectionOpen && (
                    <div className="px-4 pb-3 border-t bg-gray-50">
                      <ol className="space-y-1.5 mt-2">
                        {section.steps.map((step, j) => (
                          <li key={j} className="text-sm text-gray-600 flex gap-2">
                            <span className="text-green-600 font-medium flex-shrink-0 text-xs mt-0.5">{j + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
