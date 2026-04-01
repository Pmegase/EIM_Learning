import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("cv_url")
      .eq("user_id", auth.userId)
      .single();

    if (error) throw error;

    if (!profile?.cv_url) {
      return NextResponse.json({ cv_url: null, signed_url: null });
    }

    const { data: signedUrlData, error: signedError } = await admin.storage
      .from("documents")
      .createSignedUrl(profile.cv_url, 3600);

    if (signedError) throw signedError;

    return NextResponse.json({
      cv_url: profile.cv_url,
      signed_url: signedUrlData.signedUrl,
    });
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get old CV path and user name
    const { data: profile } = await admin
      .from("profiles")
      .select("cv_url, full_name")
      .eq("user_id", auth.userId)
      .single();

    // Upload file to private bucket
    const ext = file.name.split(".").pop() || "pdf";
    const safeName = (profile?.full_name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const path = `cvs/${safeName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("documents")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    // Update profile with new CV
    const { error } = await admin
      .from("profiles")
      .update({ cv_url: path, updated_at: new Date().toISOString() })
      .eq("user_id", auth.userId);

    if (error) throw error;

    // Delete old file if replacing
    if (profile?.cv_url) {
      await admin.storage.from("documents").remove([profile.cv_url]);
    }

    return NextResponse.json({ success: true, cv_url: path });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("cv_url")
      .eq("user_id", auth.userId)
      .single();

    if (!profile?.cv_url) {
      return NextResponse.json({ success: true });
    }

    // Delete file from storage
    await admin.storage.from("documents").remove([profile.cv_url]);

    // Clear cv_url on profile
    const { error } = await admin
      .from("profiles")
      .update({ cv_url: null, updated_at: new Date().toISOString() })
      .eq("user_id", auth.userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
