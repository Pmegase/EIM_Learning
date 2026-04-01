import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Increment view count
    await supabase
      .from("posts")
      .update({ view_count: (post.view_count ?? 0) + 1 })
      .eq("id", post.id);

    return NextResponse.json({ post: { ...post, view_count: (post.view_count ?? 0) + 1 } });
  } catch (err) {
    console.error("GET /api/public/blog/[slug] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
