import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { admin } = auth;
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const category = searchParams.get("category");

    // Count query
    let countQuery = admin
      .from("activity_logs")
      .select("*", { count: "exact", head: true });

    if (category && category !== "all") {
      countQuery = countQuery.eq("category", category);
    }

    // Data query
    let dataQuery = admin
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") {
      dataQuery = dataQuery.eq("category", category);
    }

    const [{ count, error: countError }, { data, error }] = await Promise.all([countQuery, dataQuery]);

    if (error || countError) {
      return NextResponse.json({ error: (error || countError)!.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data ?? [], total: count ?? 0 });
  } catch (error) {
    console.error("[Admin Activity Logs GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
