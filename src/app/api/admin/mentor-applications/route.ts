import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;

    const { data, error } = await admin
      .from("mentor_applications")
      .select("*, profiles(full_name, role)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ applications: data });
  } catch (error) {
    console.error("[Admin MentorApplications GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
