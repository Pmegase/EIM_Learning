/**
 * One-time script to create storage buckets in Supabase.
 * Run with: npx tsx scripts/create-bucket.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const DOCUMENT_TYPES = [
  ...IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

async function createBucket(
  name: string,
  isPublic: boolean,
  allowedMimeTypes: string[],
  fileSizeLimit: number
) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === name);

  if (exists) {
    console.log(`  Bucket "${name}" already exists.`);
    return;
  }

  const { error } = await supabase.storage.createBucket(name, {
    public: isPublic,
    fileSizeLimit,
    allowedMimeTypes,
  });

  if (error) {
    console.error(`  Failed to create "${name}":`, error.message);
  } else {
    console.log(`  Bucket "${name}" created (${isPublic ? "public" : "private"}).`);
  }
}

async function main() {
  console.log("Creating storage buckets...\n");

  // Public bucket: website images (gallery, blog covers, team photos, event banners)
  await createBucket("uploads", true, IMAGE_TYPES, 10 * 1024 * 1024); // 10MB

  // Private bucket: sensitive documents (resumes, cover letters, attachments)
  await createBucket("documents", false, DOCUMENT_TYPES, 20 * 1024 * 1024); // 20MB

  console.log("\nDone.");
}

main();
