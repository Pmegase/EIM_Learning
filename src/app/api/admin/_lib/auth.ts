import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminAuthSuccess = {
  authorized: true;
  userId: string;
  userName: string;
  admin: ReturnType<typeof createAdminClient>;
};

type AuthFailure = {
  authorized: false;
  response: NextResponse;
};

/**
 * Verify the request is from an authenticated admin user.
 * Uses server client for JWT verification, admin client for role check (bypasses RLS).
 * Returns the admin client for subsequent queries.
 */
export async function requireAdmin(): Promise<AdminAuthSuccess | AuthFailure> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    userId: user.id,
    userName: profile.full_name,
    admin,
  };
}

/**
 * Verify the request is from any authenticated user.
 * Returns the server client (with user session) and user ID.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Check if user is suspended
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_suspended")
    .eq("user_id", user.id)
    .single();

  if (profile?.is_suspended) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Account suspended" }, { status: 403 }),
    };
  }

  return {
    authorized: true as const,
    userId: user.id,
    serverClient: supabase,
  };
}
