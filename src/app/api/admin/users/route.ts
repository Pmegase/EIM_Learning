import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    // Build filtered query
    let countQuery = admin.from("profiles").select("*", { count: "exact", head: true });
    let dataQuery = admin.from("profiles").select("*").order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    if (role) { countQuery = countQuery.eq("role", role); dataQuery = dataQuery.eq("role", role); }
    if (status === "suspended") { countQuery = countQuery.eq("is_suspended", true); dataQuery = dataQuery.eq("is_suspended", true); }
    if (status === "active") { countQuery = countQuery.eq("is_suspended", false); dataQuery = dataQuery.eq("is_suspended", false); }
    if (search) { countQuery = countQuery.ilike("full_name", `%${search}%`); dataQuery = dataQuery.ilike("full_name", `%${search}%`); }

    const [{ count }, { data: profiles, error }] = await Promise.all([countQuery, dataQuery]);
    if (error) throw error;

    // Fetch emails one by one for this page only (small batch, max 20)
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

    // Stats (parallel count queries)
    const [
      { count: total },
      { count: suspended },
      { count: interns },
      { count: mentors },
      { count: corporate },
      { count: admins },
    ] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_suspended", true),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "intern"),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mentor"),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "corporate"),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    ]);

    return NextResponse.json({
      users: enriched,
      total: count ?? 0,
      stats: {
        total: total ?? 0,
        suspended: suspended ?? 0,
        interns: interns ?? 0,
        mentors: mentors ?? 0,
        corporate: corporate ?? 0,
        admins: admins ?? 0,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
