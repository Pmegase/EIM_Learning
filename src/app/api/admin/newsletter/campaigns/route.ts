import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { data: campaigns, error } = await auth.admin
      .from("newsletter_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { subject, content, preview_text, segment, scheduled_at } = body;

    const { data: campaign, error } = await auth.admin
      .from("newsletter_campaigns")
      .insert({ subject, content, preview_text, segment, scheduled_at })
      .select()
      .single();

    if (error) throw error;

    logActivity({
      supabase: auth.admin,
      userId: auth.userId,
      userName: auth.userName,
      action: "create_newsletter_campaign",
      resourceType: "newsletter_campaign",
      resourceId: campaign.id,
      resourceName: subject,
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
