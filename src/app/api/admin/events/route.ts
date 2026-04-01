import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { data: events, error } = await auth.admin
      .from("events")
      .select("*, event_registrations(count)")
      .order("start_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json();

    const { data: event, error } = await auth.admin
      .from("events")
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    logActivity({
      supabase: auth.admin,
      userId: auth.userId,
      userName: auth.userName,
      action: "create_event",
      resourceType: "event",
      resourceId: event.id,
      resourceName: event.title,
    });

    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
