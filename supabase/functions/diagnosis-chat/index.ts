import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userMessage, conversationHistory, context, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = context?.issueTitle ? `You are Ufixi, an expert UK home repair assistant. You have already analysed the following issue:

Title: ${context.issueTitle}
Category: ${context.category}
What was observed: ${context.briefDescription}
Likely causes: ${context.causes?.join("; ") || "Not specified"}
Recommended fixes: ${context.fixes?.join("; ") || "Not specified"}
Safety warnings: ${context.safetyWarnings?.join("; ") || "None"}
Estimated DIY cost: ${context.diyCostRange}
Estimated professional cost: ${context.proCostRange}

Answer the user's follow-up questions about this specific issue only. Be concise — max 3 sentences. Use plain English. Never use emojis. If the user asks something outside the scope of this issue, redirect them back to it.`
      : mode === "support"
        ? `You are Ufixi's support assistant. Help with account, login, scan, subscription, billing, and app issues in plain UK English. Be concise, practical, and never use emojis. Do not repeat the same phrase or wording used earlier in the conversation. If the user clearly needs a human or you cannot resolve the issue after reasonable troubleshooting, tell them to use the contact form below.`
        : `You are Ufixi, an expert UK home repair assistant. Help users understand home maintenance issues and safe next steps in plain UK English. Be concise — max 4 sentences. Never use emojis. Do not repeat the same phrase or wording used earlier in the conversation. If you cannot confidently help without seeing the problem, tell the user to use the Scan issue button/link in the app and upload a photo, then come back with the diagnosis for follow-up help. Always advise a qualified professional for gas, electrical, structural, or urgent water problems.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...((conversationHistory?.length ? conversationHistory : [{ role: "user", content: userMessage }]) || [])
        .map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnosis-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
