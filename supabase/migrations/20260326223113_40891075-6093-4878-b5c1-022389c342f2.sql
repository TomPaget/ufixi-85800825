
-- Notifications table for real-time push notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  read BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'normal',
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT TO public WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Authenticated can insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- In-progress scans table for premium resume feature (45-day TTL)
CREATE TABLE public.in_progress_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  step INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  location TEXT,
  category TEXT,
  uploaded_file_url TEXT,
  answers JSONB DEFAULT '[]',
  triage_data JSONB,
  diagnosis_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '45 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.in_progress_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own in-progress scans" ON public.in_progress_scans FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own in-progress scans" ON public.in_progress_scans FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own in-progress scans" ON public.in_progress_scans FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own in-progress scans" ON public.in_progress_scans FOR DELETE TO authenticated USING (user_id = auth.uid());
