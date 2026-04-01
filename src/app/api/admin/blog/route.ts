import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;

    const [postsRes, categoriesRes] = await Promise.all([
      admin.from("posts").select("*").order("created_at", { ascending: false }),
      admin.from("post_categories").select("*").order("name"),
    ]);

    if (postsRes.error) throw postsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    return NextResponse.json({
      posts: postsRes.data,
      categories: categoriesRes.data,
    });
  } catch (error) {
    console.error("[Admin Blog GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin, userId, userName } = auth;
    const body = await request.json();

    const {
      slug,
      title,
      content,
      excerpt,
      author_name,
      category_id,
      category_name,
      image_url,
      tags,
      status,
      published_at,
      scheduled_at,
    } = body;

    const { data, error } = await admin
      .from("posts")
      .insert({
        slug,
        title,
        content,
        excerpt,
        author_name,
        category_id: category_id ?? null,
        category_name,
        image_url: image_url ?? null,
        tags: tags ?? [],
        status,
        published_at: published_at ?? null,
        scheduled_at: scheduled_at ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "Created blog post",
      category: "admin",
      resourceType: "post",
      resourceId: data.id,
      resourceName: title,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[Admin Blog POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
