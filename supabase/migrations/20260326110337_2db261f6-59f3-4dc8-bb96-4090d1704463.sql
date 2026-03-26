
-- User roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles, admins can read all
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  user_tier TEXT NOT NULL DEFAULT 'free' CHECK (user_tier IN ('free', 'premium', 'business')),
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_scans INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Anonymised insights table (no PII)
CREATE TABLE public.anonymised_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type TEXT NOT NULL,
  issue_title TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT CHECK (urgency IN ('fix_now', 'fix_soon', 'monitor', 'ignore')),
  severity_score INTEGER CHECK (severity_score BETWEEN 1 AND 10),
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  diy_safe BOOLEAN DEFAULT true,
  repair_method_chosen TEXT,
  diy_cost_estimate NUMERIC,
  pro_cost_estimate NUMERIC,
  actual_cost NUMERIC,
  postcode_area TEXT,
  region TEXT,
  property_category TEXT DEFAULT 'residential' CHECK (property_category IN ('residential', 'rental', 'commercial', 'other')),
  responsibility TEXT CHECK (responsibility IN ('homeowner', 'renter', 'landlord', 'varies')),
  trade_type TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_tier TEXT DEFAULT 'free' CHECK (user_tier IN ('free', 'premium', 'business')),
  session_id TEXT NOT NULL
);

ALTER TABLE public.anonymised_insights ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous data collection), only admins can read
CREATE POLICY "Anyone can insert insights" ON public.anonymised_insights
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read insights" ON public.anonymised_insights
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Saved issues table (premium users)
CREATE TABLE public.saved_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  issue_title TEXT NOT NULL,
  category TEXT NOT NULL,
  brief_description TEXT,
  urgency TEXT,
  triage_data JSONB,
  diagnosis_data JSONB,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.saved_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own issues" ON public.saved_issues
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own issues" ON public.saved_issues
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own issues" ON public.saved_issues
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete issues" ON public.saved_issues
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
