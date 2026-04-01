import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();

    // Get user's company
    const { data: company } = await admin
      .from("companies")
      .select("id, status")
      .eq("user_id", auth.userId)
      .single();

    if (!company) {
      return NextResponse.json({ jobs: [] });
    }

    const { data: jobs, error } = await admin
      .from("job_postings")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ jobs: jobs ?? [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();

    // Get user's approved company
    const { data: company } = await admin
      .from("companies")
      .select("id, status")
      .eq("user_id", auth.userId)
      .single();

    if (!company) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    if (company.status !== "approved") {
      return NextResponse.json({ error: "Company must be approved to post jobs" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.title?.trim() || !body.description?.trim()) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

    const { data: job, error } = await admin
      .from("job_postings")
      .insert({
        company_id: company.id,
        posted_by: auth.userId,
        title: body.title,
        slug,
        description: body.description,
        requirements: body.requirements || "",
        responsibilities: body.responsibilities || "",
        job_type: body.job_type || "full-time",
        experience_level: body.experience_level || "entry",
        industry: body.industry || "other",
        location: body.location || null,
        country: body.country || null,
        is_remote: body.is_remote || false,
        salary_min: body.salary_min || null,
        salary_max: body.salary_max || null,
        salary_currency: body.salary_currency || "GHS",
        show_salary: body.show_salary || false,
        deadline: body.deadline || null,
        status: body.status || "draft",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ job }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
