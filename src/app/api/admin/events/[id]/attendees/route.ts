import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const { data: attendees, error } = await auth.admin
      .from("event_registrations")
      .select("*, event_tickets(name)")
      .eq("event_id", id);

    if (error) throw error;

    return NextResponse.json({ attendees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { registrationId, checked_in } = await request.json();

    const { data: registration, error } = await auth.admin
      .from("event_registrations")
      .update({
        checked_in,
        checked_in_at: checked_in ? new Date().toISOString() : null,
      })
      .eq("id", registrationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(registration);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
