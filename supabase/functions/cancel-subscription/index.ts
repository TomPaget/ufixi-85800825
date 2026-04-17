import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due", "unpaid"]);

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) throw new Error("Authentication failed");

    const email = userData.user.email;
    if (!email) throw new Error("Email not available");
    const userId = userData.user.id;
    logStep("User authenticated", { email, userId });

    let action: "track_attempt" | "claim_free_month" | "cancel" = "cancel";
    let reason: string | null = null;
    try {
      const body = await req.json();
      if (body?.action) action = body.action;
      if (body?.reason) reason = body.reason;
    } catch (_) { /* no body */ }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Ensure history row exists
    const { data: hist } = await adminClient
      .from("subscription_history")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!hist) {
      await adminClient.from("subscription_history").insert({
        user_id: userId,
        email,
        has_ever_subscribed: true,
        first_month_discount_used: true,
        first_month_discount_used_at: new Date().toISOString(),
      });
    }

    // ACTION: track_attempt — increments counter, returns whether to show offer
    if (action === "track_attempt") {
      const current = hist?.cancel_flow_attempts ?? 0;
      const next = current + 1;
      await adminClient.from("subscription_history").update({
        cancel_flow_attempts: next,
      }).eq("user_id", userId);
      const offerEligible = next <= 3 && !(hist?.free_month_claimed);
      logStep("Tracked attempt", { attempts: next, offerEligible });
      return new Response(JSON.stringify({
        success: true,
        attempts: next,
        offer_eligible: offerEligible,
        free_month_claimed: hist?.free_month_claimed ?? false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) throw new Error("No Stripe customer found");

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });

    const ongoingSubscription = subscriptions.data.find((subscription) =>
      ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
    );

    if (!ongoingSubscription) {
      throw new Error("No active subscription found");
    }

    const getPeriodEnd = (sub: any): string | null => {
      const candidates = [
        sub?.cancel_at,
        sub?.current_period_end,
        sub?.items?.data?.[0]?.current_period_end,
        sub?.trial_end,
      ];
      for (const ts of candidates) {
        if (typeof ts === "number" && Number.isFinite(ts) && ts > 0) {
          return new Date(ts * 1000).toISOString();
        }
      }
      // Fallback: compute from anchor + interval
      const anchor = sub?.billing_cycle_anchor;
      const interval = sub?.plan?.interval || sub?.items?.data?.[0]?.price?.recurring?.interval || "month";
      if (typeof anchor === "number") {
        const d = new Date(anchor * 1000);
        const now = new Date();
        while (d <= now) {
          if (interval === "year") d.setFullYear(d.getFullYear() + 1);
          else if (interval === "week") d.setDate(d.getDate() + 7);
          else if (interval === "day") d.setDate(d.getDate() + 1);
          else d.setMonth(d.getMonth() + 1);
        }
        return d.toISOString();
      }
      return null;
    };

    // ACTION: claim_free_month — apply 100%-off coupon for one month
    if (action === "claim_free_month") {
      if (hist?.free_month_claimed) {
        return new Response(JSON.stringify({
          success: false,
          error: "Free month already claimed",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      // Apply 100%-off coupon to the active subscription's next invoice
      await stripe.subscriptions.update(ongoingSubscription.id, {
        discounts: [{ coupon: "A9GyYOlx" }],
      });
      await adminClient.from("subscription_history").update({
        free_month_claimed: true,
        free_month_claimed_at: new Date().toISOString(),
      }).eq("user_id", userId);
      logStep("Free month claimed", { customerId: customer.id });
      return new Response(JSON.stringify({
        success: true,
        free_month_claimed: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptionEnd = getPeriodEnd(ongoingSubscription);

    if (ongoingSubscription.cancel_at_period_end) {
      logStep("Subscription already set to cancel", { subscriptionId: ongoingSubscription.id, subscriptionEnd });
      return new Response(JSON.stringify({
        success: true,
        already_cancelled: true,
        subscription_end: subscriptionEnd,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const updatedSubscription = await stripe.subscriptions.update(ongoingSubscription.id, {
      cancel_at_period_end: true,
      metadata: { cancellation_reason: reason ?? "" },
    });

    const updatedEnd = getPeriodEnd(updatedSubscription) ?? subscriptionEnd;
    logStep("Subscription cancellation scheduled", {
      subscriptionId: updatedSubscription.id,
      subscriptionEnd: updatedEnd,
    });

    return new Response(JSON.stringify({
      success: true,
      already_cancelled: false,
      subscription_end: updatedEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});