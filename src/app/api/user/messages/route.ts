import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const mentorshipId = searchParams.get("mentorship_id");

    if (!mentorshipId) {
      return NextResponse.json({ error: "mentorship_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify user is part of this mentorship
    const { data: mentorship } = await admin
      .from("mentorships")
      .select("mentor_id, mentee_id")
      .eq("id", mentorshipId)
      .single();

    if (!mentorship || (mentorship.mentor_id !== auth.userId && mentorship.mentee_id !== auth.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch messages
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const { data: messages, error } = await admin
      .from("messages")
      .select("*")
      .eq("mentorship_id", mentorshipId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Enrich with sender names
    const senderIds = [...new Set((messages ?? []).map((m) => m.sender_id))];
    let senderMap: Record<string, string> = {};
    if (senderIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", senderIds);
      senderMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.full_name]));
    }

    const enriched = (messages ?? []).map((m) => ({
      ...m,
      sender_name: senderMap[m.sender_id] || "Unknown",
    }));

    return NextResponse.json({ messages: enriched });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { mentorship_id, content } = await request.json();

    if (!mentorship_id || !content?.trim()) {
      return NextResponse.json({ error: "mentorship_id and content are required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify user is part of this active mentorship
    const { data: mentorship } = await admin
      .from("mentorships")
      .select("mentor_id, mentee_id, status")
      .eq("id", mentorship_id)
      .single();

    if (!mentorship || (mentorship.mentor_id !== auth.userId && mentorship.mentee_id !== auth.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (mentorship.status !== "active") {
      return NextResponse.json({ error: "Mentorship is not active" }, { status: 400 });
    }

    // Create message
    const { data: message, error } = await admin
      .from("messages")
      .insert({
        mentorship_id,
        sender_id: auth.userId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    // Send email notification to the other user (fire and forget)
    const recipientId = mentorship.mentor_id === auth.userId
      ? mentorship.mentee_id
      : mentorship.mentor_id;

    notifyRecipient(admin, auth.userId, recipientId, content.trim()).catch(console.error);

    return NextResponse.json({ message });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

async function notifyRecipient(
  admin: ReturnType<typeof createAdminClient>,
  senderId: string,
  recipientId: string,
  content: string,
) {
  // Get sender name and recipient email
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, full_name, email:user_id")
    .in("user_id", [senderId, recipientId]);

  if (!profiles || profiles.length < 2) return;

  const sender = profiles.find((p) => p.user_id === senderId);
  const senderName = sender?.full_name || "Someone";

  // Get recipient's email from auth
  const { data: { user: recipientUser } } = await admin.auth.admin.getUserById(recipientId);
  if (!recipientUser?.email) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const preview = content.length > 100 ? content.slice(0, 100) + "..." : content;

  await sendEmail({
    to: recipientUser.email,
    subject: `New message from ${senderName} - EIM Consult`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #16a34a;">New Message</h2>
        <p><strong>${senderName}</strong> sent you a message:</p>
        <div style="background: #f3f4f6; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; color: #374151;">${preview}</p>
        </div>
        <a href="${siteUrl}/dashboard" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Open Dashboard
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">EIM Consultancy</p>
      </div>
    `,
  });
}
