import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import LavaLampBackground from "@/components/LavaLampBackground";
import PageHeader from "@/components/PageHeader";
import DiagnosisResults from "@/components/DiagnosisResults";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { resolveSavedIssueMedia } from "@/lib/scanMedia";

const textSec = "#5A6A7A";

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authReady, user } = useSubscription();
  const [issue, setIssue] = useState<any>((location.state as any)?.issue ?? null);
  const [loading, setLoading] = useState(!(location.state as any)?.issue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const preloadedIssue = (location.state as any)?.issue;

    const loadIssue = async () => {
      try {
        if (!id) {
          setError("Missing issue ID");
          return;
        }

        if (preloadedIssue?.id === id) {
          setIssue(preloadedIssue);
          setError(null);
          return;
        }

        if (!authReady) return;

        if (!user) {
          setError("Please sign in to view this issue.");
          return;
        }

        setError(null);
        const { data, error: dbError } = await supabase
          .from("saved_issues")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (cancelled) return;

        if (dbError) {
          console.error("[IssueDetail] Load error:", dbError);
          setError(dbError.message);
          setIssue(null);
          return;
        }

        setIssue(data ? await resolveSavedIssueMedia(data) : null);
      } catch (e: any) {
        console.error("[IssueDetail] Unexpected error:", e);
        if (!cancelled) {
          setError(e?.message || "Failed to load issue");
          setIssue(null);
        }
      } finally {
        if (!cancelled && (authReady || preloadedIssue)) setLoading(false);
      }
    };

    setLoading(!preloadedIssue);
    loadIssue();

    return () => {
      cancelled = true;
    };
  }, [id, authReady, user, location.state]);

  return (
    <PageTransition>
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background: "var(--color-bg)",
          minHeight: "100dvh",
          paddingTop: "var(--safe-top)",
          paddingBottom: "calc(var(--safe-bottom) + 24px)",
        }}
      >
        <LavaLampBackground />
        <PageHeader title="Issue Detail" />
        <main className="max-w-lg mx-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-primary)" }} />
            </div>
          )}

          {!loading && error && (
            <div className="p-8 text-center space-y-3">
              <p className="text-base" style={{ color: textSec }}>
                Couldn't load this issue.
              </p>
              <p className="text-xs" style={{ color: textSec }}>{error}</p>
              <button
                onClick={() => navigate("/my-issues")}
                className="text-sm font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                Back to My Issues
              </button>
            </div>
          )}

          {!loading && !error && !issue && (
            <div className="p-8 text-center space-y-3">
              <p className="text-base" style={{ color: textSec }}>Issue not found.</p>
              <button
                onClick={() => navigate("/my-issues")}
                className="text-sm font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                Back to My Issues
              </button>
            </div>
          )}

          {!loading && !error && issue && (
            <AppErrorBoundary>
              <IssueDetailBody issue={issue} onBack={() => navigate("/my-issues")} />
            </AppErrorBoundary>
          )}
        </main>
      </div>
    </PageTransition>
  );
}

function IssueDetailBody({ issue, onBack }: { issue: any; onBack: () => void }) {
  const triage = {
    issue_title: issue.issue_title || "Issue",
    brief_description: issue.brief_description || "",
    category: issue.category || "other",
    confidence: issue.triage_data?.confidence || "medium",
    ...(issue.triage_data || {}),
  };
  const diagnosis = issue.diagnosis_data || {};
  const fileType = issue.image_url ? "image/jpeg" : null;

  return (
    <DiagnosisResults
      triage={triage}
      diagnosis={diagnosis}
      uploadedPreviewUrl={issue.image_url || null}
      uploadedFileType={fileType}
      onSave={onBack}
      onClose={onBack}
      hideSaveActions
    />
  );
}
