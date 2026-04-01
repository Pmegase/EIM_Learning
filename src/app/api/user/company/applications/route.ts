import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("job_id");

    // Get user's company
    const { data: company } = await admin
      .from("companies")
      .select("id")
      .eq("user_id", auth.userId)
      .single();

    if (!company) {
      return NextResponse.json({ applications: [] });
    }

    // Verify job belongs to this company
    if (jobId) {
      const { data: job } = await admin
        .from("job_postings")
        .select("id")
        .eq("id", jobId)
        .eq("company_id", company.id)
        .single();

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
    }

    // Fetch applications
    let query = admin
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (jobId) {
      query = query.eq("job_id", jobId);
    } else {
      // Get all jobs for this company first
      const { data: jobs } = await admin
        .from("job_postings")
        .select("id")
        .eq("company_id", company.id);

      if (!jobs || jobs.length === 0) {
        return NextResponse.json({ applications: [] });
      }

      query = query.in("job_id", jobs.map((j) => j.id));
    }

    const { data: applications, error } = await query;
    if (error) throw error;

    // Enrich with job titles
    const jobIds = [...new Set((applications ?? []).map((a) => a.job_id))];
    let jobMap: Record<string, { title: string }> = {};
    if (jobIds.length > 0) {
      const { data: jobs } = await admin
        .from("job_postings")
        .select("id, title")
        .in("id", jobIds);
      jobMap = Object.fromEntries((jobs ?? []).map((j) => [j.id, { title: j.title }]));
    }

    const enriched = (applications ?? []).map((app) => ({
      ...app,
      job_title: jobMap[app.job_id]?.title || "Unknown",
    }));

    return NextResponse.json({ applications: enriched });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
