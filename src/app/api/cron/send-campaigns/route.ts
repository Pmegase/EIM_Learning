import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eimconsult.com";

/**
 * Cron: Send scheduled newsletter campaigns whose scheduled_at has passed.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Find campaigns that are scheduled and due
    const { data: campaigns, error: campError } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (campError) throw campError;

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ message: "No campaigns due", processed: 0 });
    }

    const results = [];

    for (const campaign of campaigns) {
      // Mark as sending
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "sending" })
        .eq("id", campaign.id);

      // Get confirmed subscribers
      const { data: subscribers } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .eq("status", "confirmed");

      if (!subscribers || subscribers.length === 0) {
        await supabase
          .from("newsletter_campaigns")
          .update({ status: "sent", sent_at: now, total_recipients: 0, total_delivered: 0 })
          .eq("id", campaign.id);
        results.push({ campaign_id: campaign.id, delivered: 0, bounced: 0 });
        continue;
      }

      await supabase
        .from("newsletter_campaigns")
        .update({ total_recipients: subscribers.length })
        .eq("id", campaign.id);

      let delivered = 0;
      let bounced = 0;

      for (const sub of subscribers) {
        const unsubscribeUrl = `${SITE_URL}/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`;
        const trackingPixel = `${SITE_URL}/api/newsletter/track?cid=${campaign.id}&sid=${sub.id}&action=open`;

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #16a34a; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">${campaign.subject}</h1>
            </div>
            <div style="padding: 24px; background-color: #ffffff;">
              ${campaign.content}
            </div>
            <div style="padding: 16px 24px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280;">
              <p>EIM Learning & Development Consult</p>
              <p><a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a></p>
            </div>
            <img src="${trackingPixel}" width="1" height="1" alt="" style="display:none;" />
          </div>
        `;

        // Insert analytics record
        await supabase
          .from("campaign_analytics")
          .insert({
            campaign_id: campaign.id,
            subscriber_id: sub.id,
            delivered: false,
          });

        const result = await sendEmail({ to: sub.email, subject: campaign.subject, html });

        if (result.success) {
          delivered++;
          await supabase
            .from("campaign_analytics")
            .update({ delivered: true })
            .eq("campaign_id", campaign.id)
            .eq("subscriber_id", sub.id);
        } else {
          bounced++;
          await supabase
            .from("campaign_analytics")
            .update({ bounced: true })
            .eq("campaign_id", campaign.id)
            .eq("subscriber_id", sub.id);
        }
      }

      await supabase
        .from("newsletter_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          total_delivered: delivered,
          total_bounced: bounced,
        })
        .eq("id", campaign.id);

      results.push({ campaign_id: campaign.id, delivered, bounced, total: subscribers.length });
    }

    return NextResponse.json({ message: "Campaigns processed", results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Cron send-campaigns error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
