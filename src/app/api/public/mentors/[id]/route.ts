import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: mentor, error } = await supabase
      .from("mentor_applications")
      .select("*, profiles(full_name, avatar_url, bio, skills)")
      .eq("user_id", id)
      .eq("status", "approved")
      .single();

    if (error || !mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Count active/pending mentees
    const { count } = await supabase
      .from("mentorships")
      .select("id", { count: "exact", head: true })
      .eq("mentor_id", id)
      .in("status", ["active", "pending"]);

    return NextResponse.json({ mentor, menteeCount: count ?? 0 });
  } catch (err) {
    console.error("GET /api/public/mentors/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch mentor" },
      { status: 500 }
    );
  }
}
