import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { sendEmail } from "@/lib/email";

/**
 * Admin direct messaging — lets an admin chat with any user.
 * Creates a "direct" mentorship record as a channel if one doesn't exist.
 */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { admin } = auth;

    // Find or create a direct-message channel between admin and user
    const channelId = await getOrCreateChannel(admin, auth.userId, userId);

    const { data: messages, error } = await admin
      .from("messages")
      .select("*")
      .eq("mentorship_id", channelId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Enrich with sender names
    const senderIds = [...new Set((messages ?? []).map((m: { sender_id: string }) => m.sender_id))];
    let senderMap: Record<string, string> = {};
    if (senderIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", senderIds);
      senderMap = Object.fromEntries((profiles ?? []).map((p: { user_id: string; full_name: string }) => [p.user_id, p.full_name]));
    }

    const enriched = (messages ?? []).map((m: { sender_id: string; [key: string]: unknown }) => ({
      ...m,
      sender_name: senderMap[m.sender_id] || "Unknown",
    }));

    return NextResponse.json({ messages: enriched, channel_id: channelId });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { user_id, content } = await request.json();

    if (!user_id || !content?.trim()) {
      return NextResponse.json({ error: "user_id and content are required" }, { status: 400 });
    }

    const { admin } = auth;

    const channelId = await getOrCreateChannel(admin, auth.userId, user_id);

    const { data: message, error } = await admin
      .from("messages")
      .insert({
        mentorship_id: channelId,
        sender_id: auth.userId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    // Email notification (fire and forget)
    notifyUser(admin, auth.userName, user_id, content.trim()).catch(console.error);

    return NextResponse.json({ message, channel_id: channelId });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateChannel(admin: any, adminId: string, userId: string): Promise<string> {
  // Look for an existing admin-direct channel between these two users
  const { data: existing } = await admin
    .from("mentorships")
    .select("id")
    .eq("status", "admin_direct")
    .or(`and(mentor_id.eq.${adminId},mentee_id.eq.${userId}),and(mentor_id.eq.${userId},mentee_id.eq.${adminId})`)
    .maybeSingle();

  if (existing) return existing.id;

  // Create a new direct-message channel
  const { data: channel, error } = await admin
    .from("mentorships")
    .insert({
      mentor_id: adminId,
      mentee_id: userId,
      status: "admin_direct",
      message: "Admin direct message",
    })
    .select("id")
    .single();

  if (error) throw error;
  return channel.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyUser(admin: any, adminName: string, userId: string, content: string) {
  const { data: { user } } = await admin.auth.admin.getUserById(userId);
  if (!user?.email) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const preview = content.length > 100 ? content.slice(0, 100) + "..." : content;

  await sendEmail({
    to: user.email,
    subject: `Message from ${adminName} (Admin) - EIM Consult`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #16a34a;">New Message from Admin</h2>
        <p><strong>${adminName}</strong> sent you a message:</p>
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
