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

/** Create a signed JWT for Google OAuth2 using the service account. */
async function createSignedJwt(serviceAccount: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  // Import the RSA private key
  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${unsignedToken}.${sig}`;
}

/** Exchange a signed JWT for a short-lived Google OAuth2 access token. */
async function getAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const jwt = await createSignedJwt(serviceAccount);

  const res = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${txt}`);
  }

  const data = await res.json();
  return data.access_token;
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

    // Parse the Firebase service account from secrets
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      console.warn("FIREBASE_SERVICE_ACCOUNT not set — notification saved but not sent to devices");
      return new Response(
        JSON.stringify({
          sent: 0,
          stored: tokens.length,
          message: "Notification saved. FIREBASE_SERVICE_ACCOUNT not configured for device delivery.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id;

    // Get a short-lived OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount);

    let sent = 0;
    const staleTokens: string[] = [];

    for (const { token, platform } of tokens) {
      try {
        const message: Record<string, unknown> = {
          token,
          notification: { title, body },
          data: data || {},
        };

        // Platform-specific config
        if (platform === "android") {
          message.android = {
            priority: "high",
            notification: { channel_id: "ufixi_default", sound: "default" },
          };
        } else if (platform === "ios") {
          message.apns = {
            payload: { aps: { sound: "default", badge: 1 } },
          };
        }

        const fcmRes = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
          }
        );

        if (fcmRes.ok) {
          sent++;
        } else {
          const errBody = await fcmRes.json();
          const errorCode = errBody?.error?.details?.[0]?.errorCode || errBody?.error?.status;
          console.error("FCM v1 error:", JSON.stringify(errBody));

          if (errorCode === "UNREGISTERED" || errorCode === "INVALID_ARGUMENT") {
            staleTokens.push(token);
          }
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
