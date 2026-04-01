import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const admin = createAdminClient();

    const { data: cert, error } = await admin
      .from("certificates")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single();

    if (error || !cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const { data: signedUrlData, error: signedError } = await admin.storage
      .from("documents")
      .createSignedUrl(cert.file_url, 3600);

    if (signedError) throw signedError;

    return NextResponse.json({ signed_url: signedUrlData.signedUrl });
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
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const admin = createAdminClient();

    // Verify ownership and get file path
    const { data: cert, error: fetchError } = await admin
      .from("certificates")
      .select("file_url")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single();

    if (fetchError || !cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Delete file from storage
    await admin.storage.from("documents").remove([cert.file_url]);

    // Delete record
    const { error } = await admin
      .from("certificates")
      .delete()
      .eq("id", id)
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
