import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;

    const { data: mentorships, error } = await admin
      .from("mentorships")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Collect unique user IDs from mentor_id and mentee_id
    const userIds = new Set<string>();
    for (const m of mentorships ?? []) {
      if (m.mentor_id) userIds.add(m.mentor_id);
      if (m.mentee_id) userIds.add(m.mentee_id);
    }

    // Fetch profiles for all referenced users
    let profilesMap: Record<string, { full_name: string; email: string; avatar_url: string | null }> = {};
    if (userIds.size > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", Array.from(userIds));

      if (profiles) {
        profilesMap = Object.fromEntries(
          profiles.map((p) => [p.user_id, { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url }]),
        );
      }
    }

    // Merge profile data into mentorships
    const enriched = (mentorships ?? []).map((m) => ({
      ...m,
      mentor: profilesMap[m.mentor_id] ?? null,
      mentee: profilesMap[m.mentee_id] ?? null,
    }));

    // Count approved mentors from mentor_applications
    const { count: approvedMentorCount } = await admin
      .from("mentor_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    return NextResponse.json({ mentorships: enriched, approvedMentorCount: approvedMentorCount ?? 0 });
  } catch (error) {
    console.error("[Admin Mentorship GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
