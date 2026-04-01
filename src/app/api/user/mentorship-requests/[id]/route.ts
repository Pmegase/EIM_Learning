import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { status } = await request.json();

    if (!["active", "declined", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify this mentorship belongs to the requesting mentor
    const { data: mentorship, error: fetchError } = await admin
      .from("mentorships")
      .select("id, mentor_id, status")
      .eq("id", id)
      .eq("mentor_id", auth.userId)
      .single();

    if (fetchError || !mentorship) {
      return NextResponse.json({ error: "Mentorship not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "active") {
      updates.started_at = new Date().toISOString();
    }
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await admin
      .from("mentorships")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ mentorship: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
