import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { admin, userId, userName } = auth;
    const { status, admin_notes, started_at, completed_at } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (started_at !== undefined) updateData.started_at = started_at;
    if (completed_at !== undefined) updateData.completed_at = completed_at;

    const { data: mentorship, error } = await admin
      .from("mentorships")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "updated_mentorship",
      resourceType: "mentorship",
      resourceId: id,
      details: { updated_fields: Object.keys(updateData), status },
    });

    return NextResponse.json({ mentorship });
  } catch (error) {
    console.error("[Admin Mentorship PUT]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
