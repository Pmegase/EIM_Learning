import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const admin = createAdminClient();
    const userId = auth.userId;

    // Delete user-owned data (order matters for FK constraints)

    // 1. Messages sent by this user
    await admin.from("messages").delete().eq("sender_id", userId);

    // 2. Mentorships (as mentor or mentee)
    await admin.from("mentorships").delete().or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`);

    // 3. Mentor application
    await admin.from("mentor_applications").delete().eq("user_id", userId);

    // 4. Job applications
    await admin.from("job_applications").delete().eq("user_id", userId);

    // 5. Certificates
    const { data: certs } = await admin.from("certificates").select("file_url").eq("user_id", userId);
    if (certs && certs.length > 0) {
      await admin.storage.from("documents").remove(certs.map((c) => c.file_url));
      await admin.from("certificates").delete().eq("user_id", userId);
    }

    // 6. CV file
    const { data: profile } = await admin.from("profiles").select("cv_url, avatar_url").eq("user_id", userId).single();
    if (profile?.cv_url) {
      await admin.storage.from("documents").remove([profile.cv_url]);
    }
    if (profile?.avatar_url) {
      const match = profile.avatar_url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
      if (match) await admin.storage.from("uploads").remove([match[1]]);
    }

    // 7. Company + its jobs + job applications
    const { data: company } = await admin.from("companies").select("id").eq("user_id", userId).maybeSingle();
    if (company) {
      // Delete applications for this company's jobs
      const { data: jobs } = await admin.from("job_postings").select("id").eq("company_id", company.id);
      if (jobs && jobs.length > 0) {
        await admin.from("job_applications").delete().in("job_id", jobs.map((j) => j.id));
      }
      await admin.from("job_postings").delete().eq("company_id", company.id);
      await admin.from("companies").delete().eq("id", company.id);
    }

    // 8. Activity logs
    await admin.from("activity_logs").delete().eq("user_id", userId);

    // 9. Profile
    await admin.from("profiles").delete().eq("user_id", userId);

    // 10. Delete auth user (this is the final step)
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
