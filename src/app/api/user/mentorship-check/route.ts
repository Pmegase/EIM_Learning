import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const mentorId = request.nextUrl.searchParams.get("mentor_id");
    if (!mentorId) {
      return NextResponse.json({ error: "mentor_id required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("mentorships")
      .select("*")
      .eq("mentor_id", mentorId)
      .eq("mentee_id", auth.userId)
      .maybeSingle();

    return NextResponse.json({ mentorship: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
