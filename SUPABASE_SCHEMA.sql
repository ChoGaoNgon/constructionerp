-- 1. Users Table (Linked to Auth)
-- Note: Manually map auth.users to public.users via triggers or logic
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('BCH', 'PGD', 'accountant', 'admin')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  commander_id UUID REFERENCES public.users(id),
  director_id UUID REFERENCES public.users(id),
  planned_progress REAL NOT NULL DEFAULT 0,
  planned_cost BIGINT NOT NULL DEFAULT 0,
  collected_amount BIGINT NOT NULL DEFAULT 0,
  receivable_amount BIGINT NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Daily Reports Table (Append-only)
CREATE TABLE IF NOT EXISTS public.daily_reports (
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public users can view users') THEN
        CREATE POLICY "Public users can view users" ON public.users FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public projects can view projects') THEN
        CREATE POLICY "Public projects can view projects" ON public.projects FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public reports can view reports') THEN
        CREATE POLICY "Public reports can view reports" ON public.daily_reports FOR SELECT USING (true);
    END IF;

    -- Insertion Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for authenticated users') THEN
        CREATE POLICY "Enable insert for authenticated users" ON public.users FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for admins and owners') THEN
        CREATE POLICY "Enable update for admins and owners" ON public.users FOR UPDATE USING (
          auth.uid() = id OR 
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND role = 'admin'
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert reports') THEN
        CREATE POLICY "Users can insert reports" ON public.daily_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins and PGD can insert projects') THEN
        CREATE POLICY "Admins and PGD can insert projects" ON public.projects FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND (role = 'admin' OR role = 'PGD')
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins and PGD can update projects') THEN
        CREATE POLICY "Admins and PGD can update projects" ON public.projects FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND (role = 'admin' OR role = 'PGD')
          )
        );
    END IF;
END $$;
