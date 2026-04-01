import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin, userId, userName } = auth;
    const { id } = await params;
    const { status, rejection_reason } = await request.json();

    // Update the mentor application
    const updatePayload: Record<string, unknown> = { status };
    if (rejection_reason !== undefined) {
      updatePayload.rejection_reason = rejection_reason;
    }

    const { data: application, error } = await admin
      .from("mentor_applications")
      .update(updatePayload)
      .eq("id", id)
      .select("*, profiles(full_name, role)")
      .single();

    if (error) throw error;

    // If approved, update the user's profile role to "mentor"
    if (status === "approved" && application.user_id) {
      const { error: profileError } = await admin
        .from("profiles")
        .update({ role: "mentor" })
        .eq("user_id", application.user_id);

      if (profileError) throw profileError;
    }

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: `${status === "approved" ? "Approved" : "Rejected"} mentor application`,
      category: "admin",
      resourceType: "mentor_application",
      resourceId: id,
      resourceName: application.profiles?.full_name ?? "Unknown",
      details: rejection_reason ? { rejection_reason } : {},
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("[Admin MentorApplications PUT]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
