export type UserRole = "admin" | "mentor" | "corporate" | "intern" | "alumni";

export type MentorApplicationStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  phone: string | null;
  cv_url: string | null;
  headline: string | null;
  location: string | null;
  university: string | null;
  field_of_study: string | null;
  graduation_year: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  interests: string[];
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface MentorApplication {
  id: string;
  user_id: string;
  // Personal Information
  title: string;
  full_name: string;
  organization: string;
  division: string;
  work_email: string;
  work_phone: string;
  // Experience & Skillset
  positions_held: string;
  general_competencies: string;
  technical_competencies: string;
  // Mentorship Details
  why_mentor: string;
  max_mentees: number;
  what_can_mentee_learn: string;
  // Status
  status: MentorApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined profile data (optional)
  profiles?: Profile;
}

export interface Certificate {
  id: string;
  user_id: string;
  name: string;
  file_url: string;
  created_at: string;
}
