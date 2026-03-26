import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, title, body, data } = (await req.json()) as PushPayload;

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "user_id, title, and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all push tokens for this user
    const { data: tokens, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .eq("user_id", user_id);

    if (tokenError) throw tokenError;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No push tokens found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also insert into notifications table for in-app display
    await supabase.from("notifications").insert({
      user_id,
      title,
      message: body,
      type: data?.type || "push",
      priority: data?.priority || "normal",
      action_url: data?.action_url || null,
    });

    // Send via FCM HTTP v1 API
    // For production, you need a Firebase service account key stored as a secret.
    // This function prepares the FCM payload — actual sending requires FCM_SERVER_KEY.
    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");

    if (!fcmServerKey) {
      console.warn("FCM_SERVER_KEY not set — push tokens stored but notifications not sent to devices");
      return new Response(
        JSON.stringify({
          sent: 0,
          stored: tokens.length,
          message: "Notification saved. FCM_SERVER_KEY not configured for device delivery.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    const staleTokens: string[] = [];

    for (const { token } of tokens) {
      try {
        const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            Authorization: `key=${fcmServerKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: token,
            notification: { title, body },
            data: data || {},
          }),
        });

        const fcmData = await fcmRes.json();

        if (fcmData.success === 1) {
          sent++;
        } else if (fcmData.results?.[0]?.error === "NotRegistered" || fcmData.results?.[0]?.error === "InvalidRegistration") {
          staleTokens.push(token);
        }
      } catch (err) {
        console.error("FCM send error for token:", err);
      }
    }

    // Clean up stale tokens
    if (staleTokens.length > 0) {
      await supabase.from("push_tokens").delete().in("token", staleTokens);
    }

    return new Response(
      JSON.stringify({ sent, total: tokens.length, cleaned: staleTokens.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Send push error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
