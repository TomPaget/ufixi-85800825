import { supabase } from "@/integrations/supabase/client";

const REMOTE_URL_PREFIX = /^(https?:\/\/|data:|capacitor:\/\/|file:\/\/)/i;

export function isStoredScanMediaPath(value?: string | null) {
  return !!value && !value.startsWith("blob:") && !REMOTE_URL_PREFIX.test(value);
}

export async function uploadScanMedia(userId: string, file?: File | null) {
  if (!userId || !file) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || (file.type.startsWith("video/") ? "mp4" : "jpg");
  const path = `${userId}/saved-scans/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("scan-uploads").upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw error;
  return path;
}

export async function resolveScanMediaUrl(value?: string | null) {
  if (!value || value.startsWith("blob:")) return null;
  if (REMOTE_URL_PREFIX.test(value)) return value;

  const { data, error } = await supabase.storage.from("scan-uploads").createSignedUrl(value, 60 * 60);
  if (error) {
    console.warn("Could not resolve scan media URL:", error);
    return null;
  }

  return data.signedUrl;
}

export async function resolveSavedIssueMedia<T extends { image_url?: string | null }>(issue: T) {
  return {
    ...issue,
    image_url: await resolveScanMediaUrl(issue.image_url ?? null),
  };
}