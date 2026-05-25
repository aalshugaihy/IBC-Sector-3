CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  photo_url TEXT,
  role VARCHAR(50) DEFAULT 'member',
  is_pending BOOLEAN DEFAULT false,
  custom_permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_no VARCHAR(50),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  month VARCHAR(50),
  status VARCHAR(50) DEFAULT 'not-started',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to UUID REFERENCES users(uid) ON DELETE SET NULL,
  team_members JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  classification TEXT,
  planned_date DATE,
  actual_date DATE,
  start_date DATE,
  end_date DATE,
  completion_percentage INTEGER DEFAULT 0,
  notes TEXT,
  obstacles TEXT,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task history table (extracted from embedded array)
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(uid) ON DELETE SET NULL,
  user_name VARCHAR(255),
  changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  period VARCHAR(255),
  generated_by UUID REFERENCES users(uid) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom roles table
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL DEFAULT '{"ar":"","en":""}'::jsonb,
  permissions JSONB DEFAULT '[]'::jsonb,
  color VARCHAR(50) DEFAULT '#6b7280'
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  name_en VARCHAR(255),
  color VARCHAR(50) DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default departments (idempotent)
INSERT INTO departments (name, name_en, color) VALUES
  ('إدارة المعرفة والمؤتمرات', 'Knowledge Management & Conferences', '#6366f1'),
  ('إدارة المسؤولية المجتمعية', 'Social Responsibility', '#10b981'),
  ('إدارة المعايير المهنية', 'Professional Standards', '#f59e0b'),
  ('البرامج والدراسات العليا', 'Graduate Programs', '#8b5cf6'),
  ('إدارة التأهيل والاعتماد', 'Qualification & Accreditation', '#ec4899'),
  ('الإدارة التنفيذية للابتكار والتقنيات الناشئة', 'Innovation & Emerging Tech', '#0ea5e9')
ON CONFLICT (name) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);

-- Migration: add task_type column for task categorization (regular | recurring | committee)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) DEFAULT 'regular';
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- ===== Committees module =====
CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_no VARCHAR(50),
  name TEXT NOT NULL,
  type VARCHAR(100),
  representative_type VARCHAR(100),
  scope VARCHAR(50),
  department TEXT,
  confidentiality VARCHAR(50) DEFAULT 'public',
  status VARCHAR(50) DEFAULT 'forming',
  is_internal BOOLEAN DEFAULT false,
  organizing_entity TEXT,
  formation_date DATE,
  end_date DATE,
  chairperson TEXT,
  budget NUMERIC,
  investment NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS committee_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(uid) ON DELETE SET NULL,
  member_name TEXT,
  role VARCHAR(50) DEFAULT 'member',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS committee_id UUID REFERENCES committees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status);
CREATE INDEX IF NOT EXISTS idx_committees_department ON committees(department);
CREATE INDEX IF NOT EXISTS idx_committee_members_committee_id ON committee_members(committee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_committee_id ON tasks(committee_id);

-- ===== Request Tracker fields (merged from Excel "متتبع الطلبات") =====
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS request_no VARCHAR(50) UNIQUE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS request_type VARCHAR(50);          -- chairman/deputy/sector/internal/external/task/transaction/letter/report
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requesting_entity TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS entity_classification VARCHAR(20); -- internal/external
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS purpose VARCHAR(50);               -- completion/follow_up/feedback/approval
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS direction VARCHAR(20);             -- incoming/outgoing/internal
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS transaction_no VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS transaction_name TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS transaction_status VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS request_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_close_date DATE;

CREATE INDEX IF NOT EXISTS idx_tasks_request_no ON tasks(request_no);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_sector ON tasks(sector);
CREATE INDEX IF NOT EXISTS idx_tasks_request_type ON tasks(request_type);

-- Auto-generated request numbering: REQ-YYYY-NNN per calendar year
CREATE TABLE IF NOT EXISTS request_no_counter (
  year INT PRIMARY KEY,
  counter INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_request_no() RETURNS VARCHAR AS $$
DECLARE
  cur_year INT := EXTRACT(YEAR FROM NOW())::INT;
  next_val INT;
BEGIN
  INSERT INTO request_no_counter (year, counter)
  VALUES (cur_year, 1)
  ON CONFLICT (year) DO UPDATE SET counter = request_no_counter.counter + 1
  RETURNING counter INTO next_val;
  RETURN 'REQ-' || cur_year || '-' || LPAD(next_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Backfill request_no for any pre-existing rows that don't have one
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM tasks WHERE request_no IS NULL ORDER BY created_at ASC LOOP
    UPDATE tasks SET request_no = next_request_no() WHERE id = r.id;
  END LOOP;
END $$;
