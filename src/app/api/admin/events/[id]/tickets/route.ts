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

    const { data: tickets, error } = await auth.admin
      .from("event_tickets")
      .select("*")
      .eq("event_id", id);

    if (error) throw error;

    return NextResponse.json({ tickets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { tickets } = await request.json();

    // Delete existing tickets for this event
    const { error: deleteError } = await auth.admin
      .from("event_tickets")
      .delete()
      .eq("event_id", id);

    if (deleteError) throw deleteError;

    // Insert new tickets
    const ticketsWithEventId = tickets.map(
      (t: { name: string; description?: string; quantity: number }) => ({
        event_id: id,
        name: t.name,
        description: t.description,
        quantity: t.quantity,
      })
    );

    const { data: insertedTickets, error: insertError } = await auth.admin
      .from("event_tickets")
      .insert(ticketsWithEventId)
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({ tickets: insertedTickets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
