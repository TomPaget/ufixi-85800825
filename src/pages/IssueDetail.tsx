import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import LavaLampBackground from "@/components/LavaLampBackground";
import PageHeader from "@/components/PageHeader";
import DiagnosisResults from "@/components/DiagnosisResults";
import { supabase } from "@/integrations/supabase/client";

const textSec = "#5A6A7A";

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("saved_issues")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) console.error("Load issue:", error);
      setIssue(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      </PageTransition>
    );
  }

  if (!issue) {
    return (
      <PageTransition>
        <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
          <PageHeader title="Issue Detail" />
          <div className="p-8 text-center space-y-3">
            <p className="text-base" style={{ color: textSec }}>Issue not found.</p>
            <button onClick={() => navigate("/my-issues")} className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
              Back to My Issues
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Reconstruct triage shape expected by DiagnosisResults
  const triage = {
    issue_title: issue.issue_title,
    brief_description: issue.brief_description,
    category: issue.category,
    confidence: issue.triage_data?.confidence || "medium",
    ...(issue.triage_data || {}),
  };
  const diagnosis = issue.diagnosis_data || {};
  const fileType = issue.image_url ? "image/jpeg" : null;

  return (
    <PageTransition>
      <div
        className="min-h-screen relative overflow-hidden"
        style={{ background: "transparent", minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
      >
        <LavaLampBackground />
        <PageHeader title="Issue Detail" />
        <main className="max-w-lg mx-auto px-5 py-4">
          <DiagnosisResults
            triage={triage}
            diagnosis={diagnosis}
            uploadedPreviewUrl={issue.image_url || null}
            uploadedFileType={fileType}
            onSave={() => navigate("/my-issues")}
            onClose={() => navigate("/my-issues")}
            hideSaveActions
          />
        </main>
      </div>
    </PageTransition>
  );
}
