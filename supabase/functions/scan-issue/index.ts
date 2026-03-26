import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STAGE1_PROMPT = `You are a professional UK home inspector and building surveyor with 20+ years of experience.

A user has uploaded a photo/video of a home maintenance issue and provided this description: "{user_description}" located in their "{location}".

First, carefully examine the uploaded image/video.

Determine:
1. Does this image clearly show a genuine home, property or appliance maintenance issue? (NOT a person, landscape, food, screenshot, vehicle, etc.)
2. If yes, identify the EXACT issue category from: plumbing, electrical, structural, appliance, hvac, roofing, carpentry, painting, flooring, walls, doors_windows, heating, cooling, damp, mould, other
3. Write a precise one-sentence technical description of the SPECIFIC visible symptom you can see (e.g. "Brown water stain patch approximately 30cm diameter on plasterboard ceiling consistent with slow leak above", NOT generic descriptions)

Be specific about what you ACTUALLY SEE in the image — colour, size, location, pattern, material affected.`;

const STAGE2_PROMPT = `You are a master UK home repair diagnostician, chartered surveyor, and experienced tradesperson.

You have visually inspected the following issue:
- Category: {category}
- What you observed: {brief_description}
- User's description: {user_description}
- Location in property: {location}
- User answers to follow-up questions: {answers}

Now produce a COMPREHENSIVE, SPECIFIC, ACTIONABLE diagnosis. Do NOT give generic advice. Everything must be specific to THIS exact issue as observed.

IMPORTANT RULES:
- Every field must be specific to the image observed, NOT generic boilerplate
- UK spelling, UK product brands, UK costs in GBP
- If the issue could be dangerous (electrical, structural, gas), make safety_warnings prominent
- Costs should reflect 2024-2025 UK market rates
- Amazon search_terms should find real, purchasable UK products`;

const STAGE1_TOOL = {
  type: "function",
  function: {
    name: "triage_result",
    description: "Return the triage analysis of the home issue image",
    parameters: {
      type: "object",
      properties: {
        is_home_issue: { type: "boolean" },
        category: { type: "string" },
        brief_description: { type: "string" },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
      },
      required: ["is_home_issue", "category", "brief_description", "confidence"],
      additionalProperties: false,
    },
  },
};

const STAGE2_TOOL = {
  type: "function",
  function: {
    name: "full_diagnosis",
    description: "Return the full diagnosis for the home issue",
    parameters: {
      type: "object",
      properties: {
        likely_causes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cause: { type: "string" },
              details: { type: "string" },
            },
            required: ["cause", "details"],
          },
        },
        diagnostic_steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step_number: { type: "number" },
              action: { type: "string" },
              what_to_look_for: { type: "string" },
              safety_note: { type: "string" },
            },
            required: ["step_number", "action", "what_to_look_for"],
          },
        },
        diy_quick_fixes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string" },
              description: { type: "string" },
              estimated_time: { type: "string" },
              difficulty: { type: "string", enum: ["Easy", "Moderate", "Advanced"] },
              tools_required: { type: "array", items: { type: "string" } },
            },
            required: ["action", "description", "estimated_time", "difficulty"],
          },
        },
        tools_and_materials: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_name: { type: "string" },
              description: { type: "string" },
              estimated_cost: { type: "string" },
              search_term: { type: "string" },
              reason_needed: { type: "string" },
            },
            required: ["product_name", "search_term"],
          },
        },
        estimated_repair_time: {
          type: "object",
          properties: {
            diy_time: { type: "string" },
            professional_time: { type: "string" },
            parts_delivery: { type: "string" },
          },
        },
        urgency_assessment: {
          type: "object",
          properties: {
            level: { type: "string", enum: ["fix_now", "fix_soon", "monitor", "ignore"] },
            reason: { type: "string" },
            safe_to_delay_days: { type: "number" },
          },
          required: ["level", "reason"],
        },
        call_pro_if: { type: "array", items: { type: "string" } },
        estimated_costs: {
          type: "object",
          properties: {
            diy_min: { type: "number" },
            diy_max: { type: "number" },
            professional_min: { type: "number" },
            professional_max: { type: "number" },
          },
          required: ["diy_min", "diy_max", "professional_min", "professional_max"],
        },
        safety_warnings: { type: "array", items: { type: "string" } },
      },
      required: ["likely_causes", "diy_quick_fixes", "tools_and_materials", "urgency_assessment", "estimated_costs", "safety_warnings", "call_pro_if"],
      additionalProperties: false,
    },
  },
};

async function callAI(messages: any[], tools: any[], toolChoice: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      tools,
      tool_choice: toolChoice,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    if (response.status === 429) throw new Error("Rate limited, please try again shortly.");
    if (response.status === 402) throw new Error("Credits exhausted. Please add funds in Settings > Workspace > Usage.");
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call in AI response");
  return JSON.parse(toolCall.function.arguments);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, location, category, answers, imageBase64, imageMimeType } = await req.json();

    // Build user content with image if provided
    const userContent: any[] = [];
    if (imageBase64 && imageMimeType) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${imageMimeType};base64,${imageBase64}` },
      });
    }
    userContent.push({ type: "text", text: `Description: ${description}\nLocation: ${location}` });

    // Stage 1: Triage
    const stage1Prompt = STAGE1_PROMPT
      .replace("{user_description}", description || "Not provided")
      .replace("{location}", location || "Not specified");

    const triage = await callAI(
      [
        { role: "system", content: stage1Prompt },
        { role: "user", content: userContent },
      ],
      [STAGE1_TOOL],
      { type: "function", function: { name: "triage_result" } }
    );

    if (!triage.is_home_issue) {
      return new Response(JSON.stringify({ success: false, error: "not_home_issue", triage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stage 2: Full Diagnosis
    const stage2Prompt = STAGE2_PROMPT
      .replace("{category}", triage.category)
      .replace("{brief_description}", triage.brief_description)
      .replace("{user_description}", description || "Not provided")
      .replace("{location}", location || "Not specified")
      .replace("{answers}", JSON.stringify(answers || []));

    const stage2Content: any[] = [];
    if (imageBase64 && imageMimeType) {
      stage2Content.push({
        type: "image_url",
        image_url: { url: `data:${imageMimeType};base64,${imageBase64}` },
      });
    }
    stage2Content.push({
      type: "text",
      text: `Category: ${triage.category}\nObserved: ${triage.brief_description}\nUser description: ${description}\nLocation: ${location}\nAnswers: ${JSON.stringify(answers || [])}`,
    });

    const diagnosis = await callAI(
      [
        { role: "system", content: stage2Prompt },
        { role: "user", content: stage2Content },
      ],
      [STAGE2_TOOL],
      { type: "function", function: { name: "full_diagnosis" } }
    );

    return new Response(JSON.stringify({ success: true, triage, diagnosis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-issue error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
