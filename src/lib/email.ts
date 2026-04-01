import { createClient } from "@/lib/supabase/server";

export type EmailProvider = "gmail" | "resend";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Get the admin-configured email provider from app_settings.
 * Falls back to "gmail" if not set.
 */
async function getEmailProvider(): Promise<EmailProvider> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "email_provider")
      .single();
    if (data?.value) {
      const val = typeof data.value === "string" ? data.value : JSON.stringify(data.value);
      const parsed = val.replace(/"/g, "");
      if (parsed === "resend" || parsed === "gmail") return parsed;
    }
  } catch {
    // Fall through to default
  }
  return "gmail";
}

/**
 * Send an email using the admin-configured provider.
 * Reads the provider choice from the database, then dispatches accordingly.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const provider = await getEmailProvider();

  if (provider === "resend") {
    return sendViaResend(options);
  }
  return sendViaGmail(options);
}

async function sendViaResend(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured in environment" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || "EIM Consult <noreply@eimconsult.com>";

    await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Resend send failed";
    console.error("Resend error:", msg);
    return { success: false, error: msg };
  }
}

async function sendViaGmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return { success: false, error: "EMAIL_USER or EMAIL_PASS not configured in environment" };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: options.from || user,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gmail send failed";
    console.error("Gmail error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Send email to multiple recipients (for campaigns).
 * Returns per-recipient results.
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  htmlFn: (email: string) => string,
  from?: string
): Promise<{ delivered: number; bounced: number }> {
  let delivered = 0;
  let bounced = 0;

  for (const email of recipients) {
    const result = await sendEmail({
      to: email,
      subject,
      html: htmlFn(email),
      from,
    });
    if (result.success) delivered++;
    else bounced++;
  }

  return { delivered, bounced };
}
