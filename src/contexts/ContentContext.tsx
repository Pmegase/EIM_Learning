"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiPut } from "@/lib/api";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  link?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  linkedin?: string;
}

export interface ContentData {
  heroTexts: string[];
  services: Service[];
  vision: string;
  mission: string;
  aboutUs: string;
  teamMembers: TeamMember[];
  carouselImages: string[];
  contactInfo: {
    address: string;
    email: string;
    instagram: string;
    facebook: string;
  };
}

interface ContentContextType {
  content: ContentData;
  updateContent: (newContent: Partial<ContentData>) => void;
  saveContent: (dataToSave?: ContentData) => Promise<{ success: boolean; error?: string }>;
  isContentLoading: boolean;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
}

const defaultContent: ContentData = {
  heroTexts: [
    "Advance your skills with us",
    "Get connected with a Global Mentor",
    "Advance your professional skill set and learn new things.",
  ],
  services: [
    {
      id: "1",
      title: "Student internship program",
      description:
        "We provide students with out of classroom trainings, mentorship and direct industry experience.",
      icon: "graduation-cap",
    },
    {
      id: "2",
      title: "Mentorship Program",
      description:
        "Our Interns, are paired with mentors who are drawn from across the globe, who guide them on their duties thereby ensuring organizational growth and development to any institution privileged to hire them.",
      icon: "users",
    },
    {
      id: "3",
      title: "Professional trainings",
      description:
        "We provide High end trainings to Employees of our partners to keep them update with growing industry trends.",
      icon: "briefcase",
    },
    {
      id: "4",
      title: "Courses",
      description:
        "Personal Branding, Public Speaking, CV writing, Opportunity identification, Minute Writing, Basic Excel Skills.",
      icon: "book",
    },
  ],
  vision:
    "To be the first choice Student Consultancy in Africa that bridges the gap between Employers and students, and provides out of classroom employability skills to reduce employment.",
  mission:
    "To provide a platform that will facilitate Youth leadership, unearth the Potential of the African youth and create an accountable networking space for the continent's transformation.",
  aboutUs:
    "E.I.M Learning and Development Consult is a management consultancy whose main focus is to provide corporate institutions and organizations with well qualified and professional Interns. Our Interns, are paired with mentors who are drawn from across the globe, who guide them on their duties thereby ensuring organizational growth and development to any institution privileged to hire them. We also provide High end trainings to Employees of our partners to keep them update with growing industry trends. This is achieved through our global mentorship programs, self- development workshops internship programs and accountability partnership.",
  teamMembers: [
    {
      id: "1",
      name: "Paulina Osei Megase",
      role: "Founder & CEO",
      image: "/uploads/team-member.png",
      linkedin: "https://www.linkedin.com/in/paulina-megase-820a2595/",
    },
  ],
  carouselImages: [
    "/uploads/gallery-1.png",
    "/uploads/team-member.png",
    "/uploads/gallery-3.png",
  ],
  contactInfo: {
    address: "Accra",
    email: "eimconsultld@gmail.com",
    instagram: "eimldconsult",
    facebook: "EIM learning and development Consult",
  },
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<ContentData>(defaultContent);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const supabase = createClient();

  // Load content from database on mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data, error } = await supabase
          .from("app_content")
          .select("data")
          .eq("id", "main")
          .maybeSingle();

        if (data?.data) {
          // Merge with defaults to ensure all keys exist
          setContent((prev) => ({ ...prev, ...data.data }));
        }
      } catch {
        // Silently fall back to defaults
        console.warn("Failed to load CMS content from database, using defaults");
      } finally {
        setIsContentLoading(false);
      }
    };

    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update content in local state (for live preview in admin)
  const updateContent = useCallback((newContent: Partial<ContentData>) => {
    setContent((prev) => ({ ...prev, ...newContent }));
  }, []);

  // Save content via API route (handles auth, upsert & activity logging server-side)
  const saveContent = useCallback(async (dataToSave?: ContentData): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = dataToSave || content;
      await apiPut("/api/admin/content", { data: payload });
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save content";
      return { success: false, error: message };
    }
  }, [content]);

  return (
    <ContentContext.Provider value={{ content, updateContent, saveContent, isContentLoading, isAdmin, setIsAdmin }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
};
