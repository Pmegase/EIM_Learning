import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cron: Auto-publish blog posts whose scheduled_at has passed.
 * Flips status from "draft" to "published" and sets published_at.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Find draft posts with a scheduled_at in the past
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("posts")
      .select("id, title, slug, scheduled_at")
      .eq("status", "draft")
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (fetchError) throw fetchError;

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({ message: "No posts to publish", published: 0 });
    }

    const published = [];

    for (const post of scheduledPosts) {
      try {
        await supabase
          .from("posts")
          .update({
            status: "published",
            published_at: post.scheduled_at || now,
            scheduled_at: null,
          })
          .eq("id", post.id);

        published.push({ id: post.id, title: post.title, slug: post.slug });
      } catch (err) {
        console.error(`Failed to publish post ${post.id}:`, err);
      }
    }

    return NextResponse.json({
      message: `Published ${published.length} post(s)`,
      published,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Cron publish-posts error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
