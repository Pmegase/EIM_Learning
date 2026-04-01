import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;

    const { data, error } = await admin
      .from("app_settings")
      .select("key, value");

    if (error) throw error;

    const settings: Record<string, string> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[Admin Settings GET]", error);
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
    const { key, value } = await request.json();

    const { error } = await admin
      .from("app_settings")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) throw error;

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "Updated setting",
      category: "admin",
      resourceType: "app_settings",
      resourceName: key,
      details: { value },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Settings PUT]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
