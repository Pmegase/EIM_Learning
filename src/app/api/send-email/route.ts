import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { subject, firstName, lastName, email, message } = await request.json();

    const result = await sendEmail({
      to: "info@eimconsultld.com",
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #16a34a; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">New Contact Message</h2>
          </div>
          <div style="padding: 24px; background-color: #f9fafb;">
            <p><strong>From:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <p>${message.replace(/\n/g, "<br/>")}</p>
          </div>
        </div>
      `,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Error sending email: " + result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Error sending email: " + errorMessage }, { status: 500 });
  }
}
