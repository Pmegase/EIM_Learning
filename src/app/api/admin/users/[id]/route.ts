import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { admin } = auth;

    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("user_id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get email
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(id);

    return NextResponse.json({
      user: { ...profile, email: authUser?.email || "" },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { admin } = auth;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const actions: string[] = [];

    if (body.role !== undefined) {
      updates.role = body.role;
      actions.push(`role changed to ${body.role}`);
    }

    if (body.is_suspended !== undefined) {
      updates.is_suspended = body.is_suspended;
      actions.push(body.is_suspended ? "suspended" : "reactivated");
    }

    const { data, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("user_id", id)
      .select()
      .single();

    if (error) throw error;

    const supabase = await createClient();
    logActivity({
      supabase,
      userId: auth.userId,
      userName: auth.userName,
      action: body.is_suspended !== undefined ? (body.is_suspended ? "user.suspend" : "user.activate") : "user.update",
      category: "admin",
      resourceType: "user",
      resourceId: id,
      resourceName: data.full_name,
      details: { changes: actions },
    });

    return NextResponse.json({ user: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { admin } = auth;

    // Prevent self-deletion
    if (id === auth.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const { data: profile } = await admin.from("profiles").select("full_name, cv_url, avatar_url").eq("user_id", id).single();

    // Delete user data (same order as delete-account)
    await admin.from("messages").delete().eq("sender_id", id);
    await admin.from("mentorships").delete().or(`mentor_id.eq.${id},mentee_id.eq.${id}`);
    await admin.from("mentor_applications").delete().eq("user_id", id);
    await admin.from("job_applications").delete().eq("user_id", id);

    const { data: certs } = await admin.from("certificates").select("file_url").eq("user_id", id);
    if (certs?.length) {
      await admin.storage.from("documents").remove(certs.map((c) => c.file_url));
      await admin.from("certificates").delete().eq("user_id", id);
    }

    if (profile?.cv_url) await admin.storage.from("documents").remove([profile.cv_url]);
    if (profile?.avatar_url) {
      const match = profile.avatar_url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
      if (match) await admin.storage.from("uploads").remove([match[1]]);
    }

    const { data: company } = await admin.from("companies").select("id").eq("user_id", id).maybeSingle();
    if (company) {
      const { data: jobs } = await admin.from("job_postings").select("id").eq("company_id", company.id);
      if (jobs?.length) await admin.from("job_applications").delete().in("job_id", jobs.map((j) => j.id));
      await admin.from("job_postings").delete().eq("company_id", company.id);
      await admin.from("companies").delete().eq("id", company.id);
    }

    await admin.from("activity_logs").delete().eq("user_id", id);
    await admin.from("profiles").delete().eq("user_id", id);
    await admin.auth.admin.deleteUser(id);

    const supabase = await createClient();
    logActivity({
      supabase,
      userId: auth.userId,
      userName: auth.userName,
      action: "user.delete",
      category: "admin",
      resourceType: "user",
      resourceId: id,
      resourceName: profile?.full_name || "Unknown",
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
