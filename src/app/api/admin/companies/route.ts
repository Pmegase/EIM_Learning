import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;

    const { data: companies, error } = await admin
      .from("companies")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("[Admin Companies GET]", error);
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

    const { data: company, error } = await admin
      .from("companies")
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity({
      supabase: admin,
      userId,
      userName,
      action: "created_company",
      resourceType: "company",
      resourceId: company.id,
      resourceName: company.name,
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error("[Admin Companies POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
