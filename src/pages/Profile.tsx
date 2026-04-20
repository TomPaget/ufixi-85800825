import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import LavaLampBackground from "@/components/LavaLampBackground";
import PageHeader from "@/components/PageHeader";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const navigate = useNavigate();
  const { user, authReady, signOut } = useSubscription();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Your account has been deleted");
      await signOut();
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message || "Could not delete account. Please contact support@ufixi.co.uk");
    } finally {
      setDeleting(false);
    }
  };

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
      <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent", minHeight: "100dvh", paddingBottom: "var(--app-page-bottom-space)" }}>
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

          {/* Delete account — required by Apple Guideline 5.1.1(v) */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid rgba(220,38,38,0.2)" }}>
            <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>Danger Zone</p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account, all your saved issues, scan history, and personal data. This cannot be undone.
                    <br /><br />
                    Type <strong>DELETE</strong> below to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: "white", border: "1px solid rgba(0,23,47,0.12)", color: "var(--color-navy)" }}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={confirmText !== "DELETE" || deleting}
                    onClick={handleDeleteAccount}
                    style={{ background: "#DC2626", color: "white" }}
                  >
                    {deleting ? "Deleting…" : "Delete forever"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}