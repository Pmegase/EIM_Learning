import { pgTable, uuid, text, timestamp, integer, boolean, doublePrecision, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { EventType, EventStatus, MeetingPlatform, RegistrationStatus } from "@/types/events";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description").notNull(),
  eventType: text("event_type").$type<EventType>().notNull(),
  category: text("category").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  venueName: text("venue_name"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  meetingUrl: text("meeting_url"),
  meetingPlatform: text("meeting_platform").$type<MeetingPlatform>(),
  meetingId: text("meeting_id"),
  meetingPasscode: text("meeting_passcode"),
  capacity: integer("capacity"),
  registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
  isRegistrationOpen: boolean("is_registration_open").notNull().default(true),
  imageUrl: text("image_url"),
  galleryImages: text("gallery_images").array().notNull().default([]),
  status: text("status").$type<EventStatus>().notNull().default("draft"),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventTickets = pgTable("event_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("GHS"),
  quantity: integer("quantity").notNull(),
  sold: integer("sold").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull(),
  ticketId: uuid("ticket_id"),
  userId: uuid("user_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: text("status").$type<RegistrationStatus>().notNull().default("confirmed"),
  checkedIn: boolean("checked_in").notNull().default(false),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  eventTickets: many(eventTickets),
  eventRegistrations: many(eventRegistrations),
}));

export const eventTicketsRelations = relations(eventTickets, ({ one, many }) => ({
  event: one(events, { fields: [eventTickets.eventId], references: [events.id] }),
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
  ticket: one(eventTickets, { fields: [eventRegistrations.ticketId], references: [eventTickets.id] }),
}));

export type EventSelect = typeof events.$inferSelect;
export type EventTicketSelect = typeof eventTickets.$inferSelect;
export type EventRegistrationSelect = typeof eventRegistrations.$inferSelect;
