import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import LavaLampBackground from "@/components/LavaLampBackground";
import PageHeader from "@/components/PageHeader";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const { user, authReady } = useSubscription();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!user) { navigate("/auth"); return; }
    setFullName(user.user_metadata?.full_name || "");
    setEmail(user.email || "");
    setPhone(user.user_metadata?.phone || "");
    setAddress(user.user_metadata?.address || "");
  }, [user, authReady, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, phone, address },
      });
      if (error) throw error;

      // Update profile table too
      if (user) {
        await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
      }

      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!authReady || !user) return null;

  const inputStyle = {
    background: "white",
    border: "1px solid rgba(0,23,47,0.12)",
    color: "var(--color-navy)",
  };

  const labelStyle = {
    color: "var(--color-text-secondary)",
    fontSize: "12px",
    fontWeight: 600 as const,
    marginBottom: "4px",
    display: "block" as const,
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 16px)" }}>
        <LavaLampBackground />
        <PageHeader title="Profile" />

        <main className="max-w-lg mx-auto px-5 py-4 space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "var(--shadow-card)" }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-xl text-sm opacity-60"
                style={inputStyle}
              />
              <p className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>
                Email cannot be changed here
              </p>
            </div>

            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your address"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: "var(--gradient-primary)", color: "white", opacity: saving ? 0.7 : 1 }}
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Privacy & Data links */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid rgba(0,23,47,0.08)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Privacy & Data</p>
            <button onClick={() => navigate("/privacy")} className="w-full text-left text-sm py-2" style={{ color: "var(--color-primary)" }}>
              Privacy Policy →
            </button>
            <button onClick={() => navigate("/terms")} className="w-full text-left text-sm py-2" style={{ color: "var(--color-primary)" }}>
              Terms of Service →
            </button>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}