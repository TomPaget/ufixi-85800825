
-- Make the insert policy slightly more restrictive by requiring session_id
DROP POLICY "Anyone can insert insights" ON public.anonymised_insights;
CREATE POLICY "Authenticated can insert insights" ON public.anonymised_insights
  FOR INSERT TO authenticated
  WITH CHECK (session_id IS NOT NULL AND issue_type IS NOT NULL);

-- Also allow anon inserts (for non-logged-in users completing scans)
CREATE POLICY "Anon can insert insights" ON public.anonymised_insights
  FOR INSERT TO anon
  WITH CHECK (session_id IS NOT NULL AND issue_type IS NOT NULL);
