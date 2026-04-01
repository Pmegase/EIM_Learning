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
    const body = await request.json();
    const admin = createAdminClient();

    // Verify ownership
    const { data: job } = await admin
      .from("job_postings")
      .select("id, company_id")
      .eq("id", id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { data: company } = await admin
      .from("companies")
      .select("id")
      .eq("id", job.company_id)
      .eq("user_id", auth.userId)
      .single();

    if (!company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const allowedFields = [
      "title", "description", "requirements", "responsibilities",
      "job_type", "experience_level", "industry", "location", "country",
      "is_remote", "salary_min", "salary_max", "salary_currency", "show_salary",
      "deadline", "status",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const { data, error } = await admin
      .from("job_postings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ job: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const admin = createAdminClient();

    // Verify ownership
    const { data: job } = await admin
      .from("job_postings")
      .select("id, company_id")
      .eq("id", id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { data: company } = await admin
      .from("companies")
      .select("id")
      .eq("id", job.company_id)
      .eq("user_id", auth.userId)
      .single();

    if (!company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await admin.from("job_applications").delete().eq("job_id", id);
    const { error } = await admin.from("job_postings").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
