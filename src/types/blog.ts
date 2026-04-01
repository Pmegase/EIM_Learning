export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface PostTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string | null;
  author_name: string;
  category_id: string | null;
  category_name: string;
  image_url: string | null;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  scheduled_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  status: "pending" | "confirmed" | "unsubscribed";
  confirm_token: string | null;
  subscribed_at: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export interface NewsletterCampaign {
  id: string;
  subject: string;
  content: string;
  preview_text: string | null;
  status: CampaignStatus;
  segment: string;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_by: string | null;
  total_recipients: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  subscriber_id: string;
  delivered: boolean;
  opened: boolean;
  opened_at: string | null;
  clicked: boolean;
  clicked_at: string | null;
  bounced: boolean;
  created_at: string;
}
