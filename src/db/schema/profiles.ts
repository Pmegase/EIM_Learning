import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { UserRole } from "@/types";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  role: text("role").$type<UserRole>().notNull().default("intern"),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  skills: text("skills").array().notNull().default([]),
  phone: text("phone"),
  cvUrl: text("cv_url"),
  headline: text("headline"),
  location: text("location"),
  university: text("university"),
  fieldOfStudy: text("field_of_study"),
  graduationYear: text("graduation_year"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  githubUrl: text("github_url"),
  interests: text("interests").array().notNull().default([]),
  isSuspended: boolean("is_suspended").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  mentorApplications: many(mentorApplications),
}));

// Avoid circular: import here for relations only
import { mentorApplications } from "./mentorship";

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProfileSelect = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;
export type CertificateSelect = typeof certificates.$inferSelect;
export type CertificateInsert = typeof certificates.$inferInsert;
