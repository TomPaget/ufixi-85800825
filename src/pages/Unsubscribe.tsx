import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ufixiLogo from "@/assets/ufixi-logo.svg";
import GradientButton from "@/components/GradientButton";
import LavaLampBackground from "@/components/LavaLampBackground";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  const navy = "#00172F";
  const textSec = "#5A6A7A";

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  const messages: Record<Status, { title: string; body: string }> = {
    loading: { title: "Loading...", body: "Verifying your unsubscribe request." },
    valid: { title: "Unsubscribe", body: "Click below to unsubscribe from Ufixi app emails." },
    already: { title: "Already Unsubscribed", body: "You've already unsubscribed from these emails." },
    invalid: { title: "Invalid Link", body: "This unsubscribe link is invalid or has expired." },
    success: { title: "Unsubscribed", body: "You've been successfully unsubscribed from Ufixi app emails." },
    error: { title: "Something went wrong", body: "We couldn't process your request. Please try again later." },
  };

  const { title, body } = messages[status];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center" style={{ background: "var(--color-bg)" }}>
      <LavaLampBackground />
      <div className="relative z-10 w-full max-w-md px-6 text-center space-y-6">
        <img src={ufixiLogo} alt="Ufixi" className="h-8 mx-auto" />
        <div className="rounded-2xl p-8 space-y-4" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)" }}>
          <h1 className="text-2xl font-bold" style={{ color: navy }}>{title}</h1>
          <p className="text-base" style={{ color: textSec }}>{body}</p>
          {status === "valid" && (
            <GradientButton size="lg" onClick={handleUnsubscribe} disabled={processing}>
              {processing ? "Processing..." : "Confirm Unsubscribe"}
            </GradientButton>
          )}
        </div>
      </div>
    </div>
  );
}
