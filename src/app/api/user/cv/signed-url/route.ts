import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("user_id");

    if (!targetUserId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check authorization
    const isOwn = targetUserId === auth.userId;

    if (!isOwn) {
      // Check if requester is admin
      const { data: requesterProfile } = await admin
        .from("profiles")
        .select("role")
        .eq("user_id", auth.userId)
        .single();

      const isAdmin = requesterProfile?.role === "admin";

      if (!isAdmin) {
        // Check if requester is mentor with active mentorship to target user
        const { data: mentorship } = await admin
          .from("mentorships")
          .select("id")
          .eq("mentor_id", auth.userId)
          .eq("mentee_id", targetUserId)
          .eq("status", "active")
          .maybeSingle();

        if (!mentorship) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    // Get CV path
    const { data: profile, error } = await admin
      .from("profiles")
      .select("cv_url, full_name")
      .eq("user_id", targetUserId)
      .single();

    if (error) throw error;

    if (!profile?.cv_url) {
      return NextResponse.json({ signed_url: null, full_name: profile?.full_name ?? null });
    }

    const { data: signedUrlData, error: signedError } = await admin.storage
      .from("documents")
      .createSignedUrl(profile.cv_url, 3600);

    if (signedError) throw signedError;

    return NextResponse.json({
      signed_url: signedUrlData.signedUrl,
      full_name: profile.full_name,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
