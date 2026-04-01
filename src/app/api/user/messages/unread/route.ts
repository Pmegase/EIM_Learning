import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();

    // Get all mentorships this user is part of
    const { data: mentorships } = await admin
      .from("mentorships")
      .select("id")
      .or(`mentor_id.eq.${auth.userId},mentee_id.eq.${auth.userId}`)
      .eq("status", "active");

    if (!mentorships || mentorships.length === 0) {
      return NextResponse.json({ unread: 0 });
    }

    const mentorshipIds = mentorships.map((m) => m.id);

    // Count unread messages not sent by this user
    const { count, error } = await admin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("mentorship_id", mentorshipIds)
      .neq("sender_id", auth.userId)
      .eq("read", false);

    if (error) throw error;

    return NextResponse.json({ unread: count ?? 0 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
