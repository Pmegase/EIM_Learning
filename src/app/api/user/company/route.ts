import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("companies")
      .select("*")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ company: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

const ALLOWED_FIELDS = [
  "name", "tagline", "industry", "company_type", "company_size", "founded_year",
  "website", "headquarters", "location", "country", "description", "about",
  "specialties", "linkedin_url", "twitter_url", "facebook_url",
  "contact_email", "contact_phone", "logo_url", "cover_image_url", "employee_count",
] as const;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();

    // Verify corporate role
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", auth.userId)
      .single();

    if (profile?.role !== "corporate") {
      return NextResponse.json({ error: "Only corporate users can create companies" }, { status: 403 });
    }

    // Check if already has a company
    const { data: existing } = await admin
      .from("companies")
      .select("id")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "You already have a company" }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

    const insert: Record<string, unknown> = {
      user_id: auth.userId,
      slug,
      status: "pending",
      is_verified: false,
    };

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        insert[field] = body[field];
      }
    }

    const { data, error } = await admin
      .from("companies")
      .insert(insert)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ company: data }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const admin = createAdminClient();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await admin
      .from("companies")
      .update(updates)
      .eq("user_id", auth.userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ company: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
