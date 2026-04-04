import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.eimconsultld.com";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/jobs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/mentors`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/store`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/signup`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Dynamic: Blog posts
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, published_at, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updated_at || post.published_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic: Jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("slug, updated_at, created_at")
    .eq("status", "published");

  const jobPages: MetadataRoute.Sitemap = (jobs ?? []).map((job) => ({
    url: `${siteUrl}/jobs/${job.slug}`,
    lastModified: job.updated_at || job.created_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic: Events
  const { data: events } = await supabase
    .from("events")
    .select("slug, updated_at, created_at")
    .eq("status", "published");

  const eventPages: MetadataRoute.Sitemap = (events ?? []).map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    lastModified: event.updated_at || event.created_at,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic: Mentors
  const { data: mentors } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("role", "mentor");

  const mentorPages: MetadataRoute.Sitemap = (mentors ?? []).map((mentor) => ({
    url: `${siteUrl}/mentors/${mentor.user_id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...jobPages, ...eventPages, ...mentorPages];
}
