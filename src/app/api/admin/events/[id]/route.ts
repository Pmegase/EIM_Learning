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

    const { data: event, error } = await auth.admin
      .from("events")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    logActivity({
      supabase: auth.admin,
      userId: auth.userId,
      userName: auth.userName,
      action: "update_event",
      resourceType: "event",
      resourceId: id,
      resourceName: event.title,
    });

    return NextResponse.json(event);
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

    // Delete related records first (registrations reference tickets, so delete them first)
    const { error: registrationsError } = await auth.admin
      .from("event_registrations")
      .delete()
      .eq("event_id", id);

    if (registrationsError) throw registrationsError;

    const { error: ticketsError } = await auth.admin
      .from("event_tickets")
      .delete()
      .eq("event_id", id);

    if (ticketsError) throw ticketsError;

    const { error } = await auth.admin
      .from("events")
      .delete()
      .eq("id", id);

    if (error) throw error;

    logActivity({
      supabase: auth.admin,
      userId: auth.userId,
      userName: auth.userName,
      action: "delete_event",
      resourceType: "event",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
