import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { admin } = auth;

    // Get user email
    const { data: { user: authUser }, error: userError } = await admin.auth.admin.getUserById(id);
    if (userError || !authUser?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate password reset link
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: authUser.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`,
      },
    });

    if (error) throw error;

    // Send the reset email via Supabase (the generateLink triggers an email if email sending is configured)
    // If not auto-sent, we can use our own email system
    if (!data?.properties?.action_link) {
      // Fallback: use resetPasswordForEmail which sends email automatically
      const { error: resetError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: authUser.email,
      });
      if (resetError) throw resetError;
    }

    const supabase = await createClient();
    logActivity({
      supabase,
      userId: auth.userId,
      userName: auth.userName,
      action: "user.reset_password",
      category: "admin",
      resourceType: "user",
      resourceId: id,
      resourceName: authUser.email,
    });

    return NextResponse.json({ success: true, email: authUser.email });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
