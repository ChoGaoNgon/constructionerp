-- Full Database Schema for Construction Project Management System

-- 0. Cleanup existing tables
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.investor_payments CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.project_assignments CASCADE;
DROP TABLE IF EXISTS public.project_roles CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- 1. Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Employees (Extending system users)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  system_role TEXT CHECK (system_role IN ('ADMIN', 'CEO', 'LEADER', 'STAFF')) DEFAULT 'STAFF',
  department_id UUID REFERENCES public.departments(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contract_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  expected_end_date DATE,
  advance_rate NUMERIC(4, 2) DEFAULT 0.3,
  advance_amount NUMERIC(15, 2) DEFAULT 0,
  recovery_deadline_ratio NUMERIC(4, 2) DEFAULT 0.8,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Project Roles
CREATE TABLE IF NOT EXISTS public.project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Project Assignments
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  employee_id UUID REFERENCES public.employees(id),
  project_role_id UUID REFERENCES public.project_roles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  sequence INTEGER NOT NULL,
  completed_value NUMERIC(15, 2) NOT NULL,
  recovered_amount NUMERIC(15, 2) NOT NULL,
  paid_amount NUMERIC(15, 2) NOT NULL,
  cumulative_completed NUMERIC(15, 2) NOT NULL,
  cumulative_recovered NUMERIC(15, 2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Investor Payments
CREATE TABLE IF NOT EXISTS public.investor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  sequence INTEGER NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  paid_date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Project Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  employee_id UUID REFERENCES public.employees(id),
  type TEXT CHECK (type IN ('DAILY', 'WEEKLY', 'MONTHLY')) DEFAULT 'DAILY',
  progress_percent NUMERIC(5, 2) DEFAULT 0,
  actual_cost NUMERIC(15, 2) DEFAULT 0,
  issues TEXT,
  resolutions TEXT,
  next_tasks TEXT,
  report_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update Projects with evaluation fields
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS status_evaluation TEXT CHECK (status_evaluation IN ('SAFE', 'WARNING', 'RISK')) DEFAULT 'SAFE',
ADD COLUMN IF NOT EXISTS evaluation_note TEXT,
ADD COLUMN IF NOT EXISTS payment_plan JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS evaluator_id UUID REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS evaluation_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_end_date DATE;

-- RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated on reports" ON public.reports USING (auth.role() = 'authenticated');

-- 9. RBAC Permissions
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.user_permissions;

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource)
);

CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource)
);

-- Seed basic Project Roles
INSERT INTO public.project_roles (name, code) VALUES 
('Phó Giám Đốc', 'PGD'),
('Ban Chỉ Huy', 'BCH'),
('Kỹ sư QS', 'QS'),
('Kế toán', 'ACCOUNTANT'),
('Kỹ sư hiện trường', 'ENGINEER')
ON CONFLICT (code) DO NOTHING;
