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
    const { status, admin_notes } = await request.json();
    const admin = createAdminClient();

    // Get user's company
    const { data: company } = await admin
      .from("companies")
      .select("id")
      .eq("user_id", auth.userId)
      .single();

    if (!company) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    // Verify application belongs to a job owned by this company
    const { data: application } = await admin
      .from("job_applications")
      .select("id, job_id")
      .eq("id", id)
      .single();

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const { data: job } = await admin
      .from("job_postings")
      .select("id")
      .eq("id", application.job_id)
      .eq("company_id", company.id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    };
    if (status) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    const { data, error } = await admin
      .from("job_applications")
      .update(updates)
      .eq("id", id)
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
