import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { status, ...otherFields } = await request.json();
    const { admin } = auth;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      ...otherFields,
    };

    if (status) {
      updates.status = status;
      updates.is_verified = status === "approved";
    }

    const { data, error } = await admin
      .from("companies")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const supabase = await createClient();
    logActivity({
      supabase,
      userId: auth.userId,
      userName: auth.userName,
      action: status === "approved" ? "company.approve" : status === "rejected" ? "company.reject" : "company.update",
      category: "admin",
      resourceType: "company",
      resourceId: id,
      resourceName: data.name,
    });

    return NextResponse.json({ company: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
