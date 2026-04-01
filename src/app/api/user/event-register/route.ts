import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { userId } = auth;
    const { event_id, ticket_id, full_name, email, phone } = await request.json();

    if (!event_id || !full_name || !email) {
      return NextResponse.json(
        { error: "event_id, full_name, and email are required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: registration, error } = await admin
      .from("event_registrations")
      .insert({
        event_id,
        ticket_id: ticket_id ?? null,
        user_id: userId,
        full_name,
        email,
        phone: phone ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    console.error("[User Event Register POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
