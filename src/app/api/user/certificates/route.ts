import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("certificates")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ certificates: data ?? [] });
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
    const name = formData.get("name") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get user name for file naming
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("user_id", auth.userId)
      .single();

    const safeName = (profile?.full_name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const ext = file.name.split(".").pop() || "pdf";
    const path = `certificates/${safeName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("documents")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    // Use original filename (without extension) as display name if no name provided
    const displayName = name || file.name.replace(/\.[^/.]+$/, "");

    const { data: cert, error: insertError } = await admin
      .from("certificates")
      .insert({
        user_id: auth.userId,
        name: displayName,
        file_url: path,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ certificate: cert });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
