import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();

    const { data: mentorship } = await admin
      .from("mentorships")
      .select("id, mentor_id, status")
      .eq("mentee_id", auth.userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!mentorship) {
      return NextResponse.json({ mentorship: null });
    }

    // Get mentor name
    const { data: mentorProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("user_id", mentorship.mentor_id)
      .single();

    return NextResponse.json({
      mentorship: {
        id: mentorship.id,
        mentor_id: mentorship.mentor_id,
        status: mentorship.status,
        mentor_name: mentorProfile?.full_name || "Mentor",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
