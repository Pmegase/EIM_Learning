import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eimconsult.com";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { campaign_id } = await request.json();
    if (!campaign_id) return NextResponse.json({ error: "campaign_id required" }, { status: 400 });

    const { data: campaign } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.status === "sent") return NextResponse.json({ error: "Already sent" }, { status: 400 });

    const { data: subscribers } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("status", "confirmed");

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: "No confirmed subscribers" }, { status: 400 });
    }

    await supabase
      .from("newsletter_campaigns")
      .update({ status: "sending", total_recipients: subscribers.length, sent_by: user.id })
      .eq("id", campaign_id);

    let delivered = 0;
    let bounced = 0;

    for (const sub of subscribers) {
      const unsubscribeUrl = `${SITE_URL}/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`;
      const trackingPixel = `${SITE_URL}/api/newsletter/track?cid=${campaign_id}&sid=${sub.id}&action=open`;

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

      await supabase.from("campaign_analytics").insert({
        campaign_id,
        subscriber_id: sub.id,
        delivered: false,
      });

      const result = await sendEmail({ to: sub.email, subject: campaign.subject, html });

      if (result.success) {
        delivered++;
        await supabase
          .from("campaign_analytics")
          .update({ delivered: true })
          .eq("campaign_id", campaign_id)
          .eq("subscriber_id", sub.id);
      } else {
        bounced++;
        await supabase
          .from("campaign_analytics")
          .update({ bounced: true })
          .eq("campaign_id", campaign_id)
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
      .eq("id", campaign_id);

    return NextResponse.json({ message: "Campaign sent", delivered, bounced, total: subscribers.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Campaign send error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
