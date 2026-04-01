import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;

    // Fetch all profiles
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch emails for all users
    const enriched = await Promise.all(
      (profiles ?? []).map(async (p) => {
        try {
          const { data: { user: authUser } } = await admin.auth.admin.getUserById(p.user_id);
          return { ...p, email: authUser?.email || "" };
        } catch {
          return { ...p, email: "" };
        }
      })
    );

    // Build spreadsheet data
    const rows = enriched.map((u) => ({
      "Full Name": u.full_name || "",
      "Email": u.email || "",
      "Role": u.role || "",
      "Status": u.is_suspended ? "Suspended" : "Active",
      "Phone": u.phone || "",
      "Headline": u.headline || "",
      "Location": u.location || "",
      "University": u.university || "",
      "Field of Study": u.field_of_study || "",
      "Graduation Year": u.graduation_year || "",
      "Skills": (u.skills || []).join(", "),
      "Interests": (u.interests || []).join(", "),
      "LinkedIn": u.linkedin_url || "",
      "Portfolio": u.portfolio_url || "",
      "GitHub": u.github_url || "",
      "Bio": u.bio || "",
      "Joined": new Date(u.created_at).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...rows.map((r) => String((r as Record<string, string>)[key] || "").length)
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="eim-users-${date}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
