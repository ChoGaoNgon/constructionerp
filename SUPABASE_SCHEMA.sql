-- 1. Users Table (Linked to Auth)
-- Note: Manually map auth.users to public.users via triggers or logic
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('BCH', 'PGD', 'accountant', 'admin')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  commander_id UUID REFERENCES public.users(id),
  director_id UUID REFERENCES public.users(id),
  planned_progress REAL NOT NULL DEFAULT 0,
  planned_cost BIGINT NOT NULL DEFAULT 0,
  collected_amount BIGINT NOT NULL DEFAULT 0,
  receivable_amount BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Daily Reports Table (Append-only)
CREATE TABLE public.daily_reports (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id),
  user_id UUID REFERENCES public.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_percent REAL NOT NULL,
  manpower INTEGER NOT NULL DEFAULT 1,
  actual_cost BIGINT NOT NULL DEFAULT 0,
  issues TEXT,
  suggestions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Basic Policies (To be refined based on roles)
CREATE POLICY "Public users can view users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public projects can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public reports can view reports" ON public.daily_reports FOR SELECT USING (true);

-- Insertion Policies
CREATE POLICY "Users can insert reports" ON public.daily_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins and PGD can insert projects" ON public.projects FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND (role = 'admin' OR role = 'PGD')
  )
);

-- Note: You may also need UPDATE and DELETE policies
CREATE POLICY "Admins and PGD can update projects" ON public.projects FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND (role = 'admin' OR role = 'PGD')
  )
);
