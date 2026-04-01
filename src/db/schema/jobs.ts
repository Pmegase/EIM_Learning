import { pgTable, uuid, text, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { JobType, ExperienceLevel, JobStatus, ApplicationStatus } from "@/types/jobs";

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  industry: text("industry").notNull(),
  website: text("website"),
  description: text("description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  location: text("location"),
  country: text("country"),
  employeeCount: text("employee_count"),
  isVerified: boolean("is_verified").notNull().default(false),
  foundedYear: text("founded_year"),
  companySize: text("company_size"),
  companyType: text("company_type"),
  tagline: text("tagline"),
  about: text("about"),
  specialties: text("specialties").array().notNull().default([]),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  facebookUrl: text("facebook_url"),
  coverImageUrl: text("cover_image_url"),
  headquarters: text("headquarters"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobPostings = pgTable("job_postings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull(),
  postedBy: uuid("posted_by").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  responsibilities: text("responsibilities").notNull(),
  jobType: text("job_type").$type<JobType>().notNull(),
  experienceLevel: text("experience_level").$type<ExperienceLevel>().notNull(),
  industry: text("industry").notNull(),
  location: text("location"),
  country: text("country"),
  isRemote: boolean("is_remote").notNull().default(false),
  salaryMin: numeric("salary_min", { precision: 12, scale: 2 }),
  salaryMax: numeric("salary_max", { precision: 12, scale: 2 }),
  salaryCurrency: text("salary_currency").notNull().default("GHS"),
  showSalary: boolean("show_salary").notNull().default(false),
  deadline: timestamp("deadline", { withTimezone: true }),
  status: text("status").$type<JobStatus>().notNull().default("draft"),
  isFeatured: boolean("is_featured").notNull().default(false),
  applicationCount: integer("application_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull(),
  userId: uuid("user_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  coverLetter: text("cover_letter"),
  resumeUrl: text("resume_url"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  status: text("status").$type<ApplicationStatus>().notNull().default("submitted"),
  adminNotes: text("admin_notes"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  jobPostings: many(jobPostings),
}));

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  company: one(companies, { fields: [jobPostings.companyId], references: [companies.id] }),
  applications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  jobPosting: one(jobPostings, { fields: [jobApplications.jobId], references: [jobPostings.id] }),
}));

export type CompanySelect = typeof companies.$inferSelect;
export type JobPostingSelect = typeof jobPostings.$inferSelect;
export type JobApplicationSelect = typeof jobApplications.$inferSelect;
