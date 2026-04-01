import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const { data: campaign, error } = await auth.admin
      .from("newsletter_campaigns")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    logActivity({
      supabase: auth.admin,
      userId: auth.userId,
      userName: auth.userName,
      action: "update_newsletter_campaign",
      resourceType: "newsletter_campaign",
      resourceId: id,
      resourceName: campaign.subject,
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const { error } = await auth.admin
      .from("newsletter_campaigns")
      .delete()
      .eq("id", id);

    if (error) throw error;

    logActivity({
      supabase: auth.admin,
      userId: auth.userId,
      userName: auth.userName,
      action: "delete_newsletter_campaign",
      resourceType: "newsletter_campaign",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
