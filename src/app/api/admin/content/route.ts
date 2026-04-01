import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;

    const { data, error } = await admin
      .from("app_content")
      .select("value")
      .eq("key", "site_content")
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return NextResponse.json({ content: data?.value ?? null });
  } catch (error) {
    console.error("[Admin Content GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin, userId, userName } = auth;
    const body = await request.json();

    const { error } = await admin
      .from("app_content")
      .upsert({ key: "site_content", value: body }, { onConflict: "key" });

    if (error) throw error;

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "Updated site content",
      category: "admin",
      resourceType: "app_content",
      resourceName: "site_content",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Content PUT]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
