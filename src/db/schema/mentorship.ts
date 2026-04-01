import { pgTable, uuid, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { MentorApplicationStatus } from "@/types";
import type { MentorshipStatus } from "@/types/jobs";
import { profiles } from "./profiles";

export const mentorApplications = pgTable("mentor_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  fullName: text("full_name").notNull(),
  organization: text("organization").notNull(),
  division: text("division").notNull(),
  workEmail: text("work_email").notNull(),
  workPhone: text("work_phone").notNull(),
  positionsHeld: text("positions_held").notNull(),
  generalCompetencies: text("general_competencies").notNull(),
  technicalCompetencies: text("technical_competencies").notNull(),
  whyMentor: text("why_mentor").notNull(),
  maxMentees: integer("max_mentees").notNull().default(1),
  whatCanMenteLearn: text("what_can_mentee_learn").notNull(),
  status: text("status").$type<MentorApplicationStatus>().notNull().default("pending"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mentorships = pgTable("mentorships", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorId: uuid("mentor_id").notNull(),
  menteeId: uuid("mentee_id").notNull(),
  message: text("message"),
  goals: text("goals"),
  preferredSchedule: text("preferred_schedule"),
  status: text("status").$type<MentorshipStatus>().notNull().default("pending"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  mentorNotes: text("mentor_notes"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mentorApplicationsRelations = relations(mentorApplications, ({ one }) => ({
  profile: one(profiles, {
    fields: [mentorApplications.userId],
    references: [profiles.userId],
  }),
}));

export const mentorshipsRelations = relations(mentorships, ({ one }) => ({
  mentor: one(profiles, {
    fields: [mentorships.mentorId],
    references: [profiles.userId],
    relationName: "mentor",
  }),
  mentee: one(profiles, {
    fields: [mentorships.menteeId],
    references: [profiles.userId],
    relationName: "mentee",
  }),
}));

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorshipId: uuid("mentorship_id").notNull(),
  senderId: uuid("sender_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MentorApplicationSelect = typeof mentorApplications.$inferSelect;
export type MentorshipSelect = typeof mentorships.$inferSelect;
export type MessageSelect = typeof messages.$inferSelect;
