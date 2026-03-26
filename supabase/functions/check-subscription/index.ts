import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

function calculatePeriodEnd(anchorTimestamp: number, intervalUnit: string): string | null {
  // Calculate the next period end from billing_cycle_anchor
  const anchor = new Date(anchorTimestamp * 1000);
  const now = new Date();
  const d = new Date(anchor);

  // Advance periods until we're past now
  while (d <= now) {
    if (intervalUnit === "year") {
      d.setFullYear(d.getFullYear() + 1);
    } else if (intervalUnit === "week") {
      d.setDate(d.getDate() + 7);
    } else if (intervalUnit === "day") {
      d.setDate(d.getDate() + 1);
    } else {
      // default monthly
      d.setMonth(d.getMonth() + 1);
    }
  }
  return d.toISOString();
}

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

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Authentication failed");
    
    const email = claimsData.claims.email as string;
    if (!email) throw new Error("Email not available in token");
    logStep("User authenticated", { email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const sub = subscriptions.data[0] as any;

      // In basil API, current_period_end was removed.
      // Calculate from billing_cycle_anchor + plan interval.
      const anchor = sub.billing_cycle_anchor;
      const interval = sub.plan?.interval || sub.items?.data?.[0]?.price?.recurring?.interval || "month";

      if (typeof anchor === "number") {
        subscriptionEnd = calculatePeriodEnd(anchor, interval);
      }

      logStep("Active subscription found", { subscriptionId: sub.id, subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_end: subscriptionEnd,
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
