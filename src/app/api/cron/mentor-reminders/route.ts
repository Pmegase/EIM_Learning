import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eimconsult.com";

/**
 * Cron: Remind admins about pending mentor applications older than 3 days.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Find pending mentor applications older than 3 days
    const { data: pendingApps, error: appsError } = await supabase
      .from("mentor_applications")
      .select("id, full_name, organization, created_at")
      .eq("status", "pending")
      .lte("created_at", threeDaysAgo);

    if (appsError) throw appsError;

    if (!pendingApps || pendingApps.length === 0) {
      return NextResponse.json({ message: "No pending applications needing reminder", count: 0 });
    }

    // Get admin user IDs
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("role", "admin");

    if (adminsError) throw adminsError;

    if (!admins || admins.length === 0) {
      return NextResponse.json({ message: "No admin users found", count: 0 });
    }

    // Get admin emails from Supabase Auth
    const adminEmails: string[] = [];
    for (const admin of admins) {
      const { data } = await supabase.auth.admin.getUserById(admin.user_id);
      if (data?.user?.email) adminEmails.push(data.user.email);
    }

    if (adminEmails.length === 0) {
      return NextResponse.json({ message: "No admin emails found", count: 0 });
    }

    const appList = pendingApps
      .map((a) => `<li><strong>${a.full_name}</strong> (${a.organization}) — applied ${new Date(a.created_at).toLocaleDateString()}</li>`)
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #16a34a; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Pending Mentor Applications</h1>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p>There are <strong>${pendingApps.length}</strong> mentor application(s) awaiting review for more than 3 days:</p>
          <ul style="padding-left: 20px; line-height: 1.8;">${appList}</ul>
          <p style="margin-top: 16px;">
            <a href="${SITE_URL}/admin/dashboard" style="display: inline-block; background: #16a34a; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none;">
              Review Applications
            </a>
          </p>
        </div>
        <div style="padding: 12px 24px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280;">
          <p>EIM Learning & Development Consult — Automated Reminder</p>
        </div>
      </div>
    `;

    let sent = 0;
    for (const email of adminEmails) {
      const result = await sendEmail({
        to: email,
        subject: `[EIM] ${pendingApps.length} mentor application(s) awaiting review`,
        html,
      });
      if (result.success) sent++;
    }

    return NextResponse.json({
      message: `Reminder sent to ${sent} admin(s) about ${pendingApps.length} pending application(s)`,
      pendingCount: pendingApps.length,
      adminsSent: sent,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Cron mentor-reminders error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
