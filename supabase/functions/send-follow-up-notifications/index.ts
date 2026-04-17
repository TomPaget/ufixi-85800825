import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find follow-ups due for notification (3, 7, or 14 days after scan)
    const now = new Date().toISOString();
    const { data: pendingFollowUps, error } = await supabase
      .from("scan_follow_ups")
      .select("id, user_id, issue_title, category, follow_up_at, scanned_at, issue_resolved")
      .eq("notification_sent", false)
      .or("issue_resolved.is.null,issue_resolved.eq.false")
      .lte("follow_up_at", now)
      .limit(100);

    if (error) throw error;
    if (!pendingFollowUps || pendingFollowUps.length === 0) {
      return new Response(JSON.stringify({ message: "No pending follow-ups" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const processed: string[] = [];

    for (const followUp of pendingFollowUps) {
      // Skip silently if the user has since deleted/resolved the issue.
      if (followUp.user_id) {
        const { data: stillActive } = await supabase
          .from("saved_issues")
          .select("id, status")
          .eq("user_id", followUp.user_id)
          .eq("issue_title", followUp.issue_title)
          .neq("status", "resolved")
          .limit(1);

        // If the issue is gone or marked resolved, drop the reminder.
        if (!stillActive || stillActive.length === 0) {
          await supabase
            .from("scan_follow_ups")
            .update({ notification_sent: true, issue_resolved: true })
            .eq("id", followUp.id);
          continue;
        }

        // Pick a friendly message based on how long it's been
        const days = Math.max(
          1,
          Math.round((Date.now() - new Date(followUp.scanned_at as any).getTime()) / 86_400_000),
        );
        const subject = `Have you fixed your "${followUp.issue_title}" issue yet?`;
        const intro = days >= 14
          ? "It's been two weeks"
          : days >= 7
            ? "It's been a week"
            : "It's been a few days";

        // In-app notification + native push
        await supabase.from("notifications").insert({
          user_id: followUp.user_id,
          title: "Time to check on your repair",
          message: `${intro} since you scanned "${followUp.issue_title}". Tap to update its status.`,
          type: "follow_up",
          priority: "normal",
          action_url: "/issues",
        } as any);

        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: followUp.user_id,
              title: "Have you fixed it yet?",
              body: `${intro} since you scanned "${followUp.issue_title}". Tap to update.`,
              data: { type: "follow_up", action_url: "/issues" },
            },
          });
        } catch (pushErr) {
          console.warn("Follow-up push failed:", pushErr);
        }

        // Email reminder (best effort)
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", followUp.user_id)
          .single();

        if (profile?.email) {
          const payload = {
            to: profile.email,
            subject,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #00172F;">Hi${profile.full_name ? ` ${profile.full_name}` : ''},</h2>
                <p>${intro} since you scanned your <strong>${followUp.issue_title}</strong> issue on Ufixi.</p>
                <p>Have you managed to fix it? Open the app to update your issue status or get more help.</p>
                <a href="https://ufixi.lovable.app/issues" 
                   style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #E8530A, #D93870); color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
                  Check My Issues
                </a>
                <p style="color: #666; font-size: 12px; margin-top: 24px;">
                  — The Ufixi Team
                </p>
              </div>
            `,
          };

          try {
            await supabase.rpc("enqueue_email", {
              queue_name: "transactional_emails",
              payload: payload as any,
            });
          } catch (emailErr) {
            console.warn("Email queue failed for", followUp.id, emailErr);
          }
        }
      }

      // Mark as sent
      await supabase
        .from("scan_follow_ups")
        .update({ notification_sent: true })
        .eq("id", followUp.id);

      processed.push(followUp.id);
    }

    return new Response(JSON.stringify({ processed: processed.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-follow-up-notifications error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
