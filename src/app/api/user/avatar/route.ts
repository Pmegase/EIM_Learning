import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF are allowed" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get old avatar to clean up
    const { data: profile } = await admin
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", auth.userId)
      .single();

    // Upload to public bucket (avatars are public)
    const ext = file.name.split(".").pop() || "jpg";
    const path = `avatars/${auth.userId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("uploads")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = admin.storage.from("uploads").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;

    // Update profile
    const { error } = await admin
      .from("profiles")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("user_id", auth.userId);

    if (error) throw error;

    // Delete old avatar if it was in our bucket
    if (profile?.avatar_url) {
      const match = profile.avatar_url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
      if (match) {
        await admin.storage.from("uploads").remove([match[1]]);
      }
    }

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
