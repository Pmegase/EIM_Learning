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
    const body = await request.json();

    const { data: job, error } = await admin
      .from("job_postings")
      .update(body)
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
      action: "updated_job_posting",
      resourceType: "job_posting",
      resourceId: id,
      resourceName: job.title,
      details: { updated_fields: Object.keys(body) },
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error("[Admin Jobs PUT]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { admin, userId, userName } = auth;

    // Fetch job name for logging before deletion
    const { data: job } = await admin
      .from("job_postings")
      .select("title")
      .eq("id", id)
      .single();

    // Delete related job applications first
    const { error: appError } = await admin
      .from("job_applications")
      .delete()
      .eq("job_id", id);

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    // Delete the job posting
    const { error } = await admin.from("job_postings").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "deleted_job_posting",
      resourceType: "job_posting",
      resourceId: id,
      resourceName: job?.title,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Jobs DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
