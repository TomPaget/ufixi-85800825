
DROP POLICY "Anyone can insert follow-ups" ON public.scan_follow_ups;

CREATE POLICY "Authenticated users can insert own follow-ups"
ON public.scan_follow_ups FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can insert follow-ups with session"
ON public.scan_follow_ups FOR INSERT TO anon
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);
