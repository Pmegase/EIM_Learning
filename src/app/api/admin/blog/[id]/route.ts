import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin, userId, userName } = auth;
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await admin
      .from("posts")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "Updated blog post",
      category: "admin",
      resourceType: "post",
      resourceId: id,
      resourceName: data.title,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Admin Blog PUT]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin, userId, userName } = auth;
    const { id } = await params;

    // Fetch the post title before deleting for the activity log
    const { data: post } = await admin
      .from("posts")
      .select("title")
      .eq("id", id)
      .single();

    const { error } = await admin.from("posts").delete().eq("id", id);

    if (error) throw error;

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "Deleted blog post",
      category: "admin",
      resourceType: "post",
      resourceId: id,
      resourceName: post?.title ?? "Unknown",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Blog DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
