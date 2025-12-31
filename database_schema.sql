-- Create enum for DNA types
CREATE TYPE public.dna_type AS ENUM (
  'architect', 'fixer', 'sprinter', 'nightowl', 'experimenter', 'lonewolf', 'builder'
);

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Users table for storing analyzed users
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  dna_primary dna_type,
  dna_secondary dna_type,
  score_breakdown JSONB,
  raw_metrics JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Visits table for analytics
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analyzed_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily analytics aggregate table
CREATE TABLE public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  users_analyzed_count INTEGER DEFAULT 0,
  visits_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for users table (public read for analyzed users)
CREATE POLICY "Anyone can view analyzed users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Only edge functions can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only edge functions can update users" ON public.users
  FOR UPDATE USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for visits (public insert for tracking)
CREATE POLICY "Anyone can create visits" ON public.visits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view visits" ON public.visits
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for analytics_daily
CREATE POLICY "Admins can view analytics" ON public.analytics_daily
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only system can modify analytics" ON public.analytics_daily
  FOR ALL USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_daily_updated_at
  BEFORE UPDATE ON public.analytics_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_github_id ON public.users(github_id);
CREATE INDEX idx_visits_created_at ON public.visits(created_at);
CREATE INDEX idx_visits_path ON public.visits(path);
CREATE INDEX idx_analytics_daily_date ON public.analytics_daily(date);