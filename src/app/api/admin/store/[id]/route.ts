import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const fields = [
      "title", "description", "images", "price", "currency", "purchase_url",
      "is_free", "pickup_location", "pickup_instructions", "category", "status", "is_featured",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    // If marked free, clear price
    if (body.is_free) updates.price = null;

    const { data, error } = await auth.admin
      .from("store_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const supabase = await createClient();
    logActivity({ supabase, userId: auth.userId, userName: auth.userName, action: "store.update", category: "admin", resourceType: "store_item", resourceId: id, resourceName: data.title });

    return NextResponse.json({ item: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const { data: item } = await auth.admin.from("store_items").select("title, images").eq("id", id).single();

    // Delete images from storage
    if (item?.images?.length) {
      const paths = item.images
        .map((url: string) => url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/)?.[1])
        .filter(Boolean) as string[];
      if (paths.length) await auth.admin.storage.from("uploads").remove(paths);
    }

    const { error } = await auth.admin.from("store_items").delete().eq("id", id);
    if (error) throw error;

    const supabase = await createClient();
    logActivity({ supabase, userId: auth.userId, userName: auth.userName, action: "store.delete", category: "admin", resourceType: "store_item", resourceId: id, resourceName: item?.title || "" });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
