import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: event, error } = await supabase
      .from("events")
      .select("*, event_registrations(count)")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch active tickets for this event
    const { data: tickets } = await supabase
      .from("event_tickets")
      .select("*")
      .eq("event_id", event.id)
      .eq("is_active", true);

    return NextResponse.json({ event, tickets: tickets ?? [] });
  } catch (err) {
    console.error("GET /api/public/events/[slug] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}
