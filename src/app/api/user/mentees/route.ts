import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();

    // Verify requester is a mentor
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", auth.userId)
      .single();

    if (profile?.role !== "mentor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get active mentorships
    const { data: mentorships, error } = await admin
      .from("mentorships")
      .select("mentee_id")
      .eq("mentor_id", auth.userId)
      .eq("status", "active");

    if (error) throw error;

    if (!mentorships || mentorships.length === 0) {
      return NextResponse.json({ mentees: [] });
    }

    const menteeIds = mentorships.map((m) => m.mentee_id);

    const { data: menteeProfiles, error: profileError } = await admin
      .from("profiles")
      .select("user_id, full_name, avatar_url, headline, university")
      .in("user_id", menteeIds);

    if (profileError) throw profileError;

    return NextResponse.json({ mentees: menteeProfiles ?? [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
