import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

export interface InProgressScan {
  id: string;
  user_id: string;
  step: number;
  description: string | null;
  location: string | null;
  category: string | null;
  uploaded_file_url: string | null;
  answers: string[];
  triage_data: any;
  diagnosis_data: any;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export function useInProgressScan() {
  const { user, isPremium } = useSubscription();

  const saveScanProgress = useCallback(
    async (data: {
      scanId?: string;
      step: number;
      description?: string;
      location?: string;
      category?: string;
      uploadedFile?: File | null;
      answers?: string[];
      triageData?: any;
      diagnosisData?: any;
    }) => {
      if (!isPremium || !user) return null;

      let uploadedFileUrl = null;
      if (data.uploadedFile) {
        const ext = data.uploadedFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("scan-uploads")
          .upload(path, data.uploadedFile, { upsert: true });
        if (!uploadErr) {
          uploadedFileUrl = path;
        }
      }

      const record: any = {
        user_id: user.id,
        step: data.step,
        description: data.description || null,
        location: data.location || null,
        category: data.category || null,
        answers: data.answers || [],
        triage_data: data.triageData || null,
        diagnosis_data: data.diagnosisData || null,
        updated_at: new Date().toISOString(),
      };
      if (uploadedFileUrl) record.uploaded_file_url = uploadedFileUrl;

      if (data.scanId) {
        const { error } = await supabase
          .from("in_progress_scans")
          .update(record)
          .eq("id", data.scanId);
        if (error) console.error("Update scan progress:", error);
        return data.scanId;
      } else {
        const { data: inserted, error } = await supabase
          .from("in_progress_scans")
          .insert(record)
          .select("id")
          .single();
        if (error) console.error("Insert scan progress:", error);
        return inserted?.id || null;
      }
    },
    [user, isPremium]
  );

  const loadInProgressScans = useCallback(async (): Promise<InProgressScan[]> => {
    if (!user || !isPremium) return [];
    const { data, error } = await supabase
      .from("in_progress_scans")
      .select("*")
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Load in-progress scans:", error);
      return [];
    }
    return (data || []) as InProgressScan[];
  }, [user, isPremium]);

  const deleteScan = useCallback(
    async (scanId: string) => {
      if (!user) return;
      await supabase.from("in_progress_scans").delete().eq("id", scanId);
    },
    [user]
  );

  return { saveScanProgress, loadInProgressScans, deleteScan };
}
