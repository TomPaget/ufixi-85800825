CREATE TABLE public.subscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  cancel_flow_attempts INTEGER NOT NULL DEFAULT 0,
  free_month_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  free_month_claimed_at TIMESTAMPTZ,
  first_month_discount_used BOOLEAN NOT NULL DEFAULT FALSE,
  first_month_discount_used_at TIMESTAMPTZ,
  has_ever_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription history"
ON public.subscription_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage subscription history"
ON public.subscription_history
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.update_subscription_history_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscription_history_updated_at
BEFORE UPDATE ON public.subscription_history
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_history_updated_at();