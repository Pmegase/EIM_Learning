import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eimconsult.com";

export async function POST(request: NextRequest) {
  try {
    const { email, name, token } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const confirmUrl = `${SITE_URL}/newsletter/confirm?token=${token}`;
    const unsubscribeUrl = `${SITE_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "Confirm your EIM Consult Newsletter subscription",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #16a34a; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">EIM Consult Newsletter</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #f9fafb;">
            <h2 style="color: #111827; margin-top: 0;">Confirm your subscription</h2>
            <p style="color: #4b5563;">Hi${name ? ` ${name}` : ""},</p>
            <p style="color: #4b5563;">Thank you for signing up for the EIM Consult newsletter. Please confirm your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmUrl}" style="background-color: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Confirm Subscription
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">If you didn't sign up, you can safely ignore this email.</p>
            <p style="color: #6b7280; font-size: 14px;">Or copy and paste: <a href="${confirmUrl}" style="color: #16a34a;">${confirmUrl}</a></p>
          </div>
          <div style="padding: 16px 24px; background-color: #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
            <p>EIM Learning & Development Consult</p>
            <p><a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a></p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ message: "Confirmation email sent" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Newsletter subscribe error:", msg);
    return NextResponse.json({ message: "Subscribed (email may have failed)" });
  }
}
