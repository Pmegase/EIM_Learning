import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const [{ data: posts, error: postsError }, { data: categories, error: catsError }] =
      await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .order("published_at", { ascending: false }),
        supabase
          .from("post_categories")
          .select("*")
          .order("name"),
      ]);

    if (postsError) throw postsError;
    if (catsError) throw catsError;

    return NextResponse.json({
      posts: posts ?? [],
      categories: categories ?? [],
    });
  } catch (err) {
    console.error("GET /api/public/blog error:", err);
    return NextResponse.json(
      { error: "Failed to fetch blog data" },
      { status: 500 }
    );
  }
}
