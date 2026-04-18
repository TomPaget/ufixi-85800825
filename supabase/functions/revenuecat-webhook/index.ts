// RevenueCat → Supabase webhook.
// Configure in RevenueCat dashboard: Project settings → Integrations → Webhooks.
// URL: https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook
// Authorization header: Bearer <REVENUECAT_WEBHOOK_SECRET>  (set in RC + as a Supabase secret)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[REVENUECAT-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const expected = (Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "").trim();
    if (expected) {
      const auth = (req.headers.get("authorization") ?? "").trim();
      const provided = auth.replace(/^Bearer\s+/i, "").trim();
      if (provided !== expected) {
        log("Unauthorized");
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const event = body?.event;
    if (!event) throw new Error("Missing event");
    log("Event received", { type: event.type, app_user_id: event.app_user_id });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const userId: string | undefined = event.app_user_id;
    if (!userId) {
      log("No app_user_id, ignoring");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up email for the user (needed for subscription_history.email NOT NULL)
    let email: string | null = null;
    const { data: profile } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
    email = profile?.email ?? null;
    if (!email) {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      email = authUser?.user?.email ?? null;
    }
    if (!email) {
      log("Could not resolve email for user", { userId });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const purchaseEvents = new Set([
      "INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION",
      "NON_RENEWING_PURCHASE", "TRANSFER", "TEMPORARY_ENTITLEMENT_GRANT",
    ]);

    if (purchaseEvents.has(event.type)) {
      const { data: existing } = await admin
        .from("subscription_history")
        .select("id, first_month_discount_used")
        .eq("user_id", userId)
        .maybeSingle();

      const update: Record<string, unknown> = {
        user_id: userId,
        email,
        has_ever_subscribed: true,
        updated_at: new Date().toISOString(),
      };
      if (event.type === "INITIAL_PURCHASE" && !existing?.first_month_discount_used) {
        update.first_month_discount_used = true;
        update.first_month_discount_used_at = new Date().toISOString();
      }

      if (existing?.id) {
        await admin.from("subscription_history").update(update).eq("user_id", userId);
      } else {
        await admin.from("subscription_history").insert(update);
      }
      log("subscription_history upserted", { userId, type: event.type });
    }

    // Update profile tier for fast client reads
    if (purchaseEvents.has(event.type)) {
      await admin.from("profiles").update({ user_tier: "premium" }).eq("id", userId);
    } else if (event.type === "EXPIRATION" || event.type === "SUBSCRIPTION_PAUSED") {
      await admin.from("profiles").update({ user_tier: "free" }).eq("id", userId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
