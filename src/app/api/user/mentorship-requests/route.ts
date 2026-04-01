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

    // Get all mentorships for this mentor
    const { data: mentorships, error } = await admin
      .from("mentorships")
      .select("*")
      .eq("mentor_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!mentorships || mentorships.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    // Enrich with mentee profiles
    const menteeIds = mentorships.map((m) => m.mentee_id);
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, full_name, avatar_url, headline, university, field_of_study")
      .in("user_id", menteeIds);

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.user_id, p])
    );

    const enriched = mentorships.map((m) => ({
      ...m,
      mentee: profileMap[m.mentee_id] ?? null,
    }));

    return NextResponse.json({ requests: enriched });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
