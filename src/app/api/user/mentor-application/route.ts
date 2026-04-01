import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("mentor_applications")
      .select("*")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ application: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

const UPDATABLE_FIELDS = [
  "title", "full_name", "organization", "division",
  "work_email", "work_phone", "positions_held",
  "general_competencies", "technical_competencies",
  "why_mentor", "max_mentees", "what_can_mentee_learn",
] as const;

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const admin = createAdminClient();

    // Verify the application belongs to this user
    const { data: existing, error: fetchError } = await admin
      .from("mentor_applications")
      .select("id")
      .eq("user_id", auth.userId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Only allow updating safe fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of UPDATABLE_FIELDS) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await admin
      .from("mentor_applications")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ application: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
