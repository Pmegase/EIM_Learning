import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 1x1 transparent GIF
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(request: NextRequest) {
  const cid = request.nextUrl.searchParams.get("cid");
  const sid = request.nextUrl.searchParams.get("sid");
  const action = request.nextUrl.searchParams.get("action");

  if (cid && sid) {
    try {
      const supabase = await createClient();

      if (action === "open") {
        await supabase
          .from("campaign_analytics")
          .update({ opened: true, opened_at: new Date().toISOString() })
          .eq("campaign_id", cid)
          .eq("subscriber_id", sid);

        // Update campaign aggregate
        const { count } = await supabase
          .from("campaign_analytics")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", cid)
          .eq("opened", true);

        await supabase
          .from("newsletter_campaigns")
          .update({ total_opened: count || 0 })
          .eq("id", cid);
      }

      if (action === "click") {
        await supabase
          .from("campaign_analytics")
          .update({ clicked: true, clicked_at: new Date().toISOString() })
          .eq("campaign_id", cid)
          .eq("subscriber_id", sid);

        const { count } = await supabase
          .from("campaign_analytics")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", cid)
          .eq("clicked", true);

        await supabase
          .from("newsletter_campaigns")
          .update({ total_clicked: count || 0 })
          .eq("id", cid);

        // Redirect to the target URL if provided
        const url = request.nextUrl.searchParams.get("url");
        if (url) {
          return NextResponse.redirect(url);
        }
      }
    } catch (e) {
      console.error("Tracking error:", e);
    }
  }

  // Return tracking pixel
  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
