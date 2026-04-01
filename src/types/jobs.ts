import type { Profile } from "./index";

export type JobType = "full-time" | "part-time" | "contract" | "internship" | "volunteer";
export type ExperienceLevel = "entry" | "mid" | "senior" | "executive";
export type JobStatus = "draft" | "published" | "closed" | "filled";
export type ApplicationStatus = "submitted" | "reviewing" | "shortlisted" | "interview" | "offered" | "rejected" | "withdrawn";
export type MentorshipStatus = "pending" | "active" | "completed" | "declined" | "cancelled";

export interface Company {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string;
  website: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  location: string | null;
  country: string | null;
  employee_count: string | null;
  is_verified: boolean;
  founded_year: string | null;
  company_size: string | null;
  company_type: string | null;
  tagline: string | null;
  about: string | null;
  specialties: string[];
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  cover_image_url: string | null;
  headquarters: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export type CompanyStatus = "pending" | "approved" | "rejected";

export const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+",
] as const;

export const COMPANY_TYPES = [
  "Private", "Public", "Nonprofit", "Government", "Startup", "Partnership",
] as const;

export interface JobPosting {
  id: string;
  company_id: string;
  posted_by: string;
  title: string;
  slug: string;
  description: string;
  requirements: string;
  responsibilities: string;
  job_type: JobType;
  experience_level: ExperienceLevel;
  industry: string;
  location: string | null;
  country: string | null;
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  show_salary: boolean;
  deadline: string | null;
  status: JobStatus;
  is_featured: boolean;
  application_count: number;
  created_at: string;
  updated_at: string;
  // Joins
  companies?: Company;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  status: ApplicationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  job_postings?: JobPosting;
  profiles?: Profile;
}

export interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  message: string | null;
  goals: string | null;
  preferred_schedule: string | null;
  status: MentorshipStatus;
  started_at: string | null;
  completed_at: string | null;
  mentor_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  mentor_profile?: Profile;
  mentee_profile?: Profile;
}

export interface Message {
  id: string;
  mentorship_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_name?: string;
}

export const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "volunteer", label: "Volunteer" },
];

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "executive", label: "Executive" },
];

export const JOB_INDUSTRIES = [
  "technology", "finance", "healthcare", "education", "consulting",
  "engineering", "marketing", "legal", "energy", "agriculture",
  "manufacturing", "hospitality", "media", "government", "nonprofit", "other",
] as const;

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: "submitted", label: "Submitted", color: "secondary" },
  { value: "reviewing", label: "Under Review", color: "warning" },
  { value: "shortlisted", label: "Shortlisted", color: "success" },
  { value: "interview", label: "Interview", color: "success" },
  { value: "offered", label: "Offered", color: "success" },
  { value: "rejected", label: "Rejected", color: "destructive" },
  { value: "withdrawn", label: "Withdrawn", color: "secondary" },
];
