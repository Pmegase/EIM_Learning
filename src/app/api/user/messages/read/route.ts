import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { mentorship_id } = await request.json();
    if (!mentorship_id) {
      return NextResponse.json({ error: "mentorship_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify user is part of this mentorship
    const { data: mentorship } = await admin
      .from("mentorships")
      .select("mentor_id, mentee_id")
      .eq("id", mentorship_id)
      .single();

    if (!mentorship || (mentorship.mentor_id !== auth.userId && mentorship.mentee_id !== auth.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark all messages NOT sent by this user as read
    const { error } = await admin
      .from("messages")
      .update({ read: true })
      .eq("mentorship_id", mentorship_id)
      .neq("sender_id", auth.userId)
      .eq("read", false);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
