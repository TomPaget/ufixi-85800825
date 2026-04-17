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
 * Loads recent scans for premium users:
 * - All auto_recent rows that haven't expired
 * - PLUS any other saved_issues created in the last AUTO_RECENT_DAYS days
 *   (so manually saved scans also show up here for quick access)
 *
 * Capped at MAX_AUTO_RECENT total. Also fires off a background delete of
 * expired auto-recent rows.
 */
export async function loadRecentScans(userId: string) {
  const nowIso = new Date().toISOString();
  const cutoffIso = new Date(Date.now() - AUTO_RECENT_DAYS * 86400000).toISOString();

  // Background cleanup of expired auto-recent rows
  supabase
    .from("saved_issues")
    .delete()
    .eq("user_id", userId)
    .eq("status", AUTO_RECENT_STATUS)
    .lt("expires_at", nowIso)
    .then(() => {});

  // Pull ALL of the user's saved_issues rows (RLS already restricts to this user).
  // We then filter client side so we never miss auto_recent rows whose created_at
  // happens to fall outside a window that doesn't account for the 7 day expiry.
  const { data, error } = await supabase
    .from("saved_issues")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.warn("loadRecentScans error:", error);
    return [];
  }

  const rows = (data || []).filter((r: any) => {
    // Always keep auto_recent rows whose expiry is still in the future
    if (r.status === AUTO_RECENT_STATUS) {
      if (!r.expires_at) return true;
      return r.expires_at >= nowIso;
    }
    // Manually saved rows from the last 7 days also surface in Recent Scans
    return r.created_at && r.created_at >= cutoffIso;
  });

  return rows.slice(0, MAX_AUTO_RECENT);
}
