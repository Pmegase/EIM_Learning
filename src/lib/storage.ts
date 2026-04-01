import { createClient } from "@/lib/supabase/client";

/**
 * Public bucket — images displayed on the website (gallery, blog covers, etc.)
 * Private bucket — sensitive documents (resumes, cover letters)
 */
const PUBLIC_BUCKET = "uploads";
const PRIVATE_BUCKET = "documents";

type PublicFolder = "gallery" | "blog" | "team" | "events" | "attachments" | "store";
type PrivateFolder = "resumes" | "cover-letters" | "cvs" | "certificates";

function generateName(folder: string, file: File): string {
  const ext = file.name.split(".").pop() || "bin";
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/**
 * Upload a file to the public "uploads" bucket.
 * Returns a permanent public URL.
 */
export async function uploadFile(
  file: File,
  folder: PublicFolder
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const path = generateName(folder, file);

  const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Upload error:", error.message);
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/**
 * Upload a file to the private "documents" bucket.
 * Returns the storage path (NOT a public URL). Use `getDocumentUrl()` to get a signed URL.
 */
export async function uploadPrivateFile(
  file: File,
  folder: PrivateFolder
): Promise<{ path: string | null; error: string | null }> {
  const supabase = createClient();
  const path = generateName(folder, file);

  const { error } = await supabase.storage.from(PRIVATE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Upload error:", error.message);
    return { path: null, error: error.message };
  }

  return { path, error: null };
}

/**
 * Get a time-limited signed URL for a private document.
 * Default expiry: 1 hour (3600 seconds).
 */
export async function getDocumentUrl(
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("Signed URL error:", error.message);
    return null;
  }
  return data.signedUrl;
}

/**
 * Delete a file from the public bucket by its public URL.
 */
export async function deleteFile(publicUrl: string): Promise<boolean> {
  const supabase = createClient();
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
  if (!match) return false;

  const { error } = await supabase.storage.from(PUBLIC_BUCKET).remove([match[1]]);
  if (error) {
    console.error("Delete error:", error.message);
    return false;
  }
  return true;
}

/**
 * Delete a file from the private bucket by its storage path.
 */
export async function deletePrivateFile(path: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(PRIVATE_BUCKET).remove([path]);
  if (error) {
    console.error("Delete error:", error.message);
    return false;
  }
  return true;
}
