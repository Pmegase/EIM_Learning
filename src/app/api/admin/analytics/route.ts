import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const supabase = auth.admin;

  // Parallel fetch all data
  const [
    profilesRes,
    postsRes,
    eventsRes,
    registrationsRes,
    jobsRes,
    applicationsRes,
    subscribersRes,
    campaignsRes,
    mentorAppsRes,
    mentorshipsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("role, created_at"),
    supabase.from("posts").select("status, category_name, view_count, published_at, created_at"),
    supabase.from("events").select("status, event_type, category, start_date, created_at"),
    supabase.from("event_registrations").select("status, checked_in, created_at"),
    supabase.from("job_postings").select("status, job_type, experience_level, industry, is_remote, application_count, created_at"),
    supabase.from("job_applications").select("status, created_at"),
    supabase.from("newsletter_subscribers").select("status, subscribed_at, created_at"),
    supabase.from("newsletter_campaigns").select("status, total_recipients, total_delivered, total_opened, total_clicked, total_bounced, sent_at"),
    supabase.from("mentor_applications").select("status, created_at"),
    supabase.from("mentorships").select("status, created_at"),
  ]);

  return NextResponse.json({
    profiles: profilesRes.data || [],
    posts: postsRes.data || [],
    events: eventsRes.data || [],
    registrations: registrationsRes.data || [],
    jobs: jobsRes.data || [],
    applications: applicationsRes.data || [],
    subscribers: subscribersRes.data || [],
    campaigns: campaignsRes.data || [],
    mentorApps: mentorAppsRes.data || [],
    mentorships: mentorshipsRes.data || [],
  });
}
