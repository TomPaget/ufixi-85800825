
CREATE TABLE public.scan_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  issue_title text NOT NULL,
  category text,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  follow_up_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  notification_sent boolean NOT NULL DEFAULT false,
  issue_resolved boolean DEFAULT null,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follow-ups"
ON public.scan_follow_ups FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own follow-ups"
ON public.scan_follow_ups FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert follow-ups"
ON public.scan_follow_ups FOR INSERT TO authenticated, anon
WITH CHECK (true);

CREATE INDEX idx_scan_follow_ups_pending 
ON public.scan_follow_ups (follow_up_at) 
WHERE notification_sent = false;
