import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();
    const { data } = await admin
      .from("mentorships")
      .select("id")
      .eq("mentee_id", auth.userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ has_mentor: !!data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
