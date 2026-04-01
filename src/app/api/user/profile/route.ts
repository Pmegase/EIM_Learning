import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const UPDATABLE_FIELDS = [
  "full_name", "bio", "phone", "skills", "headline", "location",
  "university", "field_of_study", "graduation_year",
  "linkedin_url", "portfolio_url", "github_url", "interests",
] as const;

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const admin = createAdminClient();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of UPDATABLE_FIELDS) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("user_id", auth.userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
