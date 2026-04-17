ALTER TABLE public.saved_issues
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_saved_issues_user_status_expires
  ON public.saved_issues (user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_saved_issues_user_created
  ON public.saved_issues (user_id, created_at DESC);