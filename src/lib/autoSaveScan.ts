import { supabase } from "@/integrations/supabase/client";

export const AUTO_RECENT_STATUS = "auto_recent";
export const MAX_AUTO_RECENT = 20;
export const AUTO_RECENT_DAYS = 7;

/**
 * Auto-saves a completed scan for premium users into `saved_issues` with
 * status="auto_recent" and a 7-day expiry. Used so premium users can revisit
 * recent scans they didn't manually save.
 *
 * Trims the auto-recent bucket to MAX_AUTO_RECENT (oldest first).
 */
export async function autoSaveRecentScan(opts: {
  userId: string;
  triage: any;
  diagnosis: any;
  category: string | null;
  imageUrl: string | null;
}): Promise<string | null> {
  try {
    const expiresAt = new Date(Date.now() + AUTO_RECENT_DAYS * 86400000).toISOString();

    const { data: inserted, error } = await supabase
      .from("saved_issues")
      .insert({
        user_id: opts.userId,
        issue_title: opts.triage?.issue_title || "Untitled Issue",
        brief_description: opts.triage?.brief_description || "",
        category: opts.triage?.category || opts.category || "other",
        urgency: opts.diagnosis?.urgency_assessment?.level || null,
        diagnosis_data: opts.diagnosis,
        triage_data: opts.triage,
        image_url: opts.imageUrl || null,
        status: AUTO_RECENT_STATUS,
        expires_at: expiresAt,
      } as any)
      .select("id")
      .maybeSingle();

    if (error) {
      console.warn("autoSaveRecentScan insert failed:", error);
      return null;
    }

    // Trim oldest auto-recent rows beyond cap
    const { data: all } = await supabase
      .from("saved_issues")
      .select("id, created_at")
      .eq("user_id", opts.userId)
      .eq("status", AUTO_RECENT_STATUS)
      .order("created_at", { ascending: false });

    if (all && all.length > MAX_AUTO_RECENT) {
      const toDelete = all.slice(MAX_AUTO_RECENT).map((r) => r.id);
      await supabase.from("saved_issues").delete().in("id", toDelete);
    }

    return inserted?.id || null;
  } catch (e) {
    console.warn("autoSaveRecentScan error:", e);
    return null;
  }
}

/**
 * Loads up to MAX_AUTO_RECENT non-expired auto-recent scans for the user.
 * Also fires off a background delete of expired rows.
 */
export async function loadRecentScans(userId: string) {
  const nowIso = new Date().toISOString();

  // Background cleanup of expired rows (don't await)
  supabase
    .from("saved_issues")
    .delete()
    .eq("user_id", userId)
    .eq("status", AUTO_RECENT_STATUS)
    .lt("expires_at", nowIso)
    .then(() => {});

  const { data, error } = await supabase
    .from("saved_issues")
    .select("*")
    .eq("user_id", userId)
    .eq("status", AUTO_RECENT_STATUS)
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(MAX_AUTO_RECENT);

  if (error) {
    console.warn("loadRecentScans error:", error);
    return [];
  }
  return data || [];
}
