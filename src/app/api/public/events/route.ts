import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: events, error } = await supabase
      .from("events")
      .select("*, event_registrations(count)")
      .eq("status", "published")
      .order("start_date", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ events: events ?? [] });
  } catch (err) {
    console.error("GET /api/public/events error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
