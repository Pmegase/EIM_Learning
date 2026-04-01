import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupBaseSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum(["intern", "mentor", "corporate", "admin"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const adminSignupSchema = signupBaseSchema.and(
  z.object({
    adminCode: z.string().min(1, "Admin signup code is required"),
  })
);

export const mentorPersonalInfoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  fullName: z.string().min(2, "Full name is required"),
  organization: z.string().min(1, "Organization is required"),
  division: z.string().min(1, "Division is required"),
  workEmail: z.string().email("Please enter a valid work email"),
  workPhone: z.string().min(7, "Please enter a valid phone number"),
});

export const mentorExperienceSchema = z.object({
  positionsHeld: z.string().min(10, "Please list your positions and grades"),
  generalCompetencies: z.string().min(10, "Please describe your general competencies"),
  technicalCompetencies: z.string().min(10, "Please describe your technical competencies"),
});

export const mentorDetailsSchema = z.object({
  whyMentor: z.string().min(10, "Please explain why you want to be a mentor"),
  maxMentees: z.coerce.number().min(1, "Must mentor at least 1 mentee").max(10, "Maximum 10 mentees"),
  whatCanMenteeLearn: z.string().min(10, "Please describe what a mentee can learn from you"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupBaseSchema>;
export type AdminSignupFormData = z.infer<typeof adminSignupSchema>;
export type MentorPersonalInfo = z.infer<typeof mentorPersonalInfoSchema>;
export type MentorExperience = z.infer<typeof mentorExperienceSchema>;
export type MentorDetails = z.infer<typeof mentorDetailsSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ── Jobs & Mentorship ──

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  website: z.string().url("Must be a valid URL").or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters"),
  contact_email: z.string().email("Valid email required"),
  contact_phone: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  country: z.string().min(1, "Country is required"),
  employee_count: z.string().optional(),
});

export const jobPostingSchema = z.object({
  title: z.string().min(3, "Job title is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  requirements: z.string().min(10, "Requirements are required"),
  responsibilities: z.string().min(10, "Responsibilities are required"),
  job_type: z.enum(["full-time", "part-time", "contract", "internship", "volunteer"]),
  experience_level: z.enum(["entry", "mid", "senior", "executive"]),
  industry: z.string().min(1, "Industry is required"),
  location: z.string().optional(),
  country: z.string().optional(),
  is_remote: z.boolean(),
  deadline: z.string().optional(),
});

export const jobApplicationSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  cover_letter: z.string().min(20, "Cover letter must be at least 20 characters"),
  resume_url: z.string().optional(),
  linkedin_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  portfolio_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export const mentorshipRequestSchema = z.object({
  message: z.string().min(10, "Please write a message to the mentor"),
  goals: z.string().min(10, "Please describe your mentorship goals"),
  preferred_schedule: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
export type JobPostingFormData = z.infer<typeof jobPostingSchema>;
export type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;
export type MentorshipRequestFormData = z.infer<typeof mentorshipRequestSchema>;
