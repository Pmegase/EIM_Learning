import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { data, error } = await auth.admin
      .from("store_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ items: data ?? [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

    const { data, error } = await auth.admin
      .from("store_items")
      .insert({
        slug,
        title: body.title,
        description: body.description || "",
        images: body.images || [],
        price: body.is_free ? null : (body.price || null),
        currency: body.currency || "GHS",
        purchase_url: body.purchase_url || null,
        is_free: body.is_free || false,
        pickup_location: body.pickup_location || null,
        pickup_instructions: body.pickup_instructions || null,
        category: body.category || "general",
        status: body.status || "draft",
        is_featured: body.is_featured || false,
      })
      .select()
      .single();

    if (error) throw error;

    const supabase = await createClient();
    logActivity({ supabase, userId: auth.userId, userName: auth.userName, action: "store.create", category: "admin", resourceType: "store_item", resourceId: data.id, resourceName: data.title });

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
