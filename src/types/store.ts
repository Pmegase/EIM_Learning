export type StoreItemStatus = "draft" | "published";

export interface StoreItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  images: string[];
  price: number | null;
  currency: string;
  purchase_url: string | null;
  is_free: boolean;
  pickup_location: string | null;
  pickup_instructions: string | null;
  category: string;
  status: StoreItemStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export const STORE_CATEGORIES = [
  "general", "apparel", "books", "accessories", "electronics", "stationery", "other",
] as const;
