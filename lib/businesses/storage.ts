import "server-only";

import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";

const BUCKET = "business-media";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function createBusinessMediaUploadUrl(input: {
  businessId: string;
  filename: string;
  contentType: string;
}): Promise<{ path: string; token: string; signedUrl: string } | null> {
  if (!ALLOWED_TYPES.has(input.contentType)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }

  const extension = input.filename.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${input.businessId}/${crypto.randomUUID()}.${extension}`;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create upload URL.");
  }

  return {
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

export async function registerBusinessMedia(input: {
  businessId: string;
  businessLocationId?: string | null;
  storagePath: string;
  mediaType: "logo" | "photo" | "cover";
  altText?: string;
  approve?: boolean;
}): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("business_media")
    .insert({
      business_id: input.businessId,
      business_location_id: input.businessLocationId ?? null,
      media_type: input.mediaType,
      storage_path: input.storagePath,
      alt_text: input.altText ?? "",
      approved: input.approve ?? false,
      display_order: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    return null;
  }

  if (input.mediaType === "logo" && input.approve) {
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(input.storagePath);
    // Bucket is private; store path and resolve signed reads later.
    await supabase
      .from("businesses")
      .update({ logo_url: input.storagePath })
      .eq("id", input.businessId);
    void publicUrl;
  }

  return data.id;
}

export async function getSignedBusinessMediaUrl(storagePath: string): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60);
    if (error || !data) {
      return null;
    }
    return data.signedUrl;
  } catch {
    return null;
  }
}

export function assertBusinessMediaSize(byteLength: number): void {
  if (byteLength > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
}
