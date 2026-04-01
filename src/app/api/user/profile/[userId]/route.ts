import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLIC_FIELDS = "user_id, full_name, avatar_url, headline, bio, location, university, field_of_study, graduation_year, skills, interests, linkedin_url, portfolio_url, github_url, role";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { userId } = await params;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("profiles")
      .select(PUBLIC_FIELDS)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
