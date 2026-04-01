import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { userId } = auth;
    const {
      job_id,
      full_name,
      email,
      phone,
      cover_letter,
      resume_url,
      linkedin_url,
      portfolio_url,
    } = await request.json();

    if (!job_id || !full_name || !email) {
      return NextResponse.json(
        { error: "job_id, full_name, and email are required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: application, error } = await admin
      .from("job_applications")
      .insert({
        job_id,
        user_id: userId,
        full_name,
        email,
        phone: phone ?? null,
        cover_letter: cover_letter ?? null,
        resume_url: resume_url ?? null,
        linkedin_url: linkedin_url ?? null,
        portfolio_url: portfolio_url ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("[User Job Apply POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
