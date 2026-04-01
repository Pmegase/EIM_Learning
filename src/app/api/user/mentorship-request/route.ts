import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { userId } = auth;
    const { mentor_id, message, goals, preferred_schedule } = await request.json();

    if (!mentor_id) {
      return NextResponse.json({ error: "mentor_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: mentorship, error } = await admin
      .from("mentorships")
      .insert({
        mentor_id,
        mentee_id: userId,
        message: message ?? null,
        goals: goals ?? null,
        preferred_schedule: preferred_schedule ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mentorship }, { status: 201 });
  } catch (error) {
    console.error("[User Mentorship Request POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
