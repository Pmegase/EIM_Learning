import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: mentors, error } = await supabase
      .from("mentor_applications")
      .select("*, profiles(full_name, avatar_url, bio, skills)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ mentors: mentors ?? [] });
  } catch (err) {
    console.error("GET /api/public/mentors error:", err);
    return NextResponse.json(
      { error: "Failed to fetch mentors" },
      { status: 500 }
    );
  }
}
