import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { admin } = auth;

    const { data: applications, error } = await admin
      .from("job_applications")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[Admin Job Applications GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id: jobId } = await params;
    const { admin, userId, userName } = auth;
    const { applicationId, status, admin_notes } = await request.json();

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "applicationId and status are required" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    const { data: application, error } = await admin
      .from("job_applications")
      .update(updateData)
      .eq("id", applicationId)
      .eq("job_id", jobId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "updated_job_application_status",
      resourceType: "job_application",
      resourceId: applicationId,
      details: { job_id: jobId, status, admin_notes },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error("[Admin Job Applications PUT]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
