import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();

    const { data: applications, error } = await admin
      .from("job_applications")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!applications || applications.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    // Enrich with job + company info
    const jobIds = [...new Set(applications.map((a) => a.job_id))];
    const { data: jobs } = await admin
      .from("job_postings")
      .select("id, title, slug, company_id, location, job_type, status")
      .in("id", jobIds);

    const companyIds = [...new Set((jobs ?? []).map((j) => j.company_id))];
    const { data: companies } = await admin
      .from("companies")
      .select("id, name, logo_url")
      .in("id", companyIds);

    const jobMap = Object.fromEntries((jobs ?? []).map((j) => [j.id, j]));
    const companyMap = Object.fromEntries((companies ?? []).map((c) => [c.id, c]));

    const enriched = applications.map((app) => {
      const job = jobMap[app.job_id];
      const company = job ? companyMap[job.company_id] : null;
      return {
        ...app,
        job: job ? { title: job.title, slug: job.slug, location: job.location, job_type: job.job_type, status: job.status } : null,
        company: company ? { name: company.name, logo_url: company.logo_url } : null,
      };
    });

    return NextResponse.json({ applications: enriched });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
