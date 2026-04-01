import { pgTable, uuid, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";

export const storeItems = pgTable("store_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  images: text("images").array().notNull().default([]),
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("GHS"),
  purchaseUrl: text("purchase_url"),
  isFree: boolean("is_free").notNull().default(false),
  pickupLocation: text("pickup_location"),
  pickupInstructions: text("pickup_instructions"),
  category: text("category").notNull().default("general"),
  status: text("status").$type<"draft" | "published">().notNull().default("draft"),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StoreItemSelect = typeof storeItems.$inferSelect;
