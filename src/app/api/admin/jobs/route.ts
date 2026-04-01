import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;

    const [jobsResult, companiesResult] = await Promise.all([
      admin
        .from("job_postings")
        .select("*, companies(name, logo_url, location, country)")
        .order("created_at", { ascending: false }),
      admin.from("companies").select("*").order("name", { ascending: true }),
    ]);

    if (jobsResult.error) {
      return NextResponse.json({ error: jobsResult.error.message }, { status: 500 });
    }
    if (companiesResult.error) {
      return NextResponse.json({ error: companiesResult.error.message }, { status: 500 });
    }

    return NextResponse.json({ jobs: jobsResult.data, companies: companiesResult.data });
  } catch (error) {
    console.error("[Admin Jobs GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin, userId, userName } = auth;
    const body = await request.json();

    const { data: job, error } = await admin.from("job_postings").insert(body).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "created_job_posting",
      resourceType: "job_posting",
      resourceId: job.id,
      resourceName: job.title,
      details: { company_id: job.company_id },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("[Admin Jobs POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
