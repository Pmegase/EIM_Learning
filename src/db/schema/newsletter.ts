import { pgTable, uuid, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { CampaignStatus } from "@/types/blog";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  status: text("status").$type<"pending" | "confirmed" | "unsubscribed">().notNull().default("pending"),
  confirmToken: text("confirm_token"),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  previewText: text("preview_text"),
  status: text("status").$type<CampaignStatus>().notNull().default("draft"),
  segment: text("segment").notNull().default("all"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  sentBy: uuid("sent_by"),
  totalRecipients: integer("total_recipients").notNull().default(0),
  totalDelivered: integer("total_delivered").notNull().default(0),
  totalOpened: integer("total_opened").notNull().default(0),
  totalClicked: integer("total_clicked").notNull().default(0),
  totalBounced: integer("total_bounced").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaignAnalytics = pgTable("campaign_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull(),
  subscriberId: uuid("subscriber_id").notNull(),
  delivered: boolean("delivered").notNull().default(false),
  opened: boolean("opened").notNull().default(false),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clicked: boolean("clicked").notNull().default(false),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  bounced: boolean("bounced").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterCampaignsRelations = relations(newsletterCampaigns, ({ many }) => ({
  analytics: many(campaignAnalytics),
}));

export const campaignAnalyticsRelations = relations(campaignAnalytics, ({ one }) => ({
  campaign: one(newsletterCampaigns, {
    fields: [campaignAnalytics.campaignId],
    references: [newsletterCampaigns.id],
  }),
  subscriber: one(newsletterSubscribers, {
    fields: [campaignAnalytics.subscriberId],
    references: [newsletterSubscribers.id],
  }),
}));

export type NewsletterSubscriberSelect = typeof newsletterSubscribers.$inferSelect;
export type NewsletterCampaignSelect = typeof newsletterCampaigns.$inferSelect;
export type CampaignAnalyticsSelect = typeof campaignAnalytics.$inferSelect;
