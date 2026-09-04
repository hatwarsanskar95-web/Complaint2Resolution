-- ============================================================
-- COMPLAINT2RESOLUTION — MASTER DATABASE SCHEMA
-- SIH 2026 — Smart Automation
-- Designed for Supabase PostgreSQL
-- ============================================================

-- 1. Custom Types & ENUMs
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'dept_admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM (
    'SUBMITTED',               -- Created by citizen
    'RECEIVED',                -- Routed to department queue
    'ASSIGNED',                -- Claimed by or assigned to officer
    'IN_PROGRESS',             -- Officer commenced work
    'RESOLUTION_SUBMITTED',    -- Officer uploaded resolution evidence
    'AI_VERIFICATION',         -- Gemini verifying resolution evidence
    'RESOLVED',                -- Resolution verified
    'CITIZEN_VERIFICATION',    -- Awaiting citizen confirmation / dispute
    'CLOSED',                  -- Citizen confirmed resolution
    'DISPUTED',                -- Citizen disputed with mandatory photo
    'AI_DISPUTE_VERIFICATION', -- Gemini analyzing citizen dispute
    'REOPENED',                -- Verified dispute reopened same ticket
    'HUMAN_REVIEW_REQUIRED'    -- Low AI confidence or supervisor review queue
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL, -- e.g. WATER, SANITATION, ROADS, ELECTRICAL, DRAINAGE, PARKS
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Department Categories (Taxonomy & SLA Baselines)
CREATE TABLE IF NOT EXISTS public.department_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  default_sla_hours INTEGER NOT NULL DEFAULT 48,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, subcategory)
);

-- 5. Officer Department Mappings
CREATE TABLE IF NOT EXISTS public.officer_departments (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (profile_id, department_id)
);

-- 6. Core Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  permanent_id TEXT UNIQUE, -- CR-YYYY-XXXXXX generated via trigger
  citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  priority priority_level NOT NULL DEFAULT 'MEDIUM',
  status complaint_status NOT NULL DEFAULT 'SUBMITTED',
  
  sla_start_time TIMESTAMP WITH TIME ZONE,
  sla_duration_hours INTEGER,
  sla_deadline TIMESTAMP WITH TIME ZONE,
  
  assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  needs_human_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Complaint Images
CREATE TABLE IF NOT EXISTS public.complaint_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('original', 'before', 'after', 'dispute')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Gemini AI Complaint Analysis
CREATE TABLE IF NOT EXISTS public.complaint_ai_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  category TEXT,
  subcategory TEXT,
  department_recommendation TEXT,
  priority_recommendation TEXT,
  summary TEXT,
  recommended_actions JSONB,
  suggested_sla_hours INTEGER,
  confidence DOUBLE PRECISION,
  needs_human_review BOOLEAN DEFAULT FALSE,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Complaint Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  old_status complaint_status,
  new_status complaint_status NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. SLA Events Log
CREATE TABLE IF NOT EXISTS public.sla_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('reminder', 'warning', 'critical_warning', 'breach')),
  elapsed_percent INTEGER,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Escalations Record
CREATE TABLE IF NOT EXISTS public.escalations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  escalation_level INTEGER NOT NULL DEFAULT 1, -- 1: Supervisor, 2: Dept Admin, 3: Central Authority
  previous_assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  escalated_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  delay_duration_hours DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Officer Resolution Submissions
CREATE TABLE IF NOT EXISTS public.resolution_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE UNIQUE,
  officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_taken TEXT NOT NULL,
  before_photo_url TEXT NOT NULL,
  after_photo_url TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Resolution Reports (AI Generated / Officer Confirmed)
CREATE TABLE IF NOT EXISTS public.resolution_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE UNIQUE,
  officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  report_text TEXT NOT NULL,
  ai_generated_text TEXT,
  is_edited BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Gemini AI Resolution Verification
CREATE TABLE IF NOT EXISTS public.ai_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  verdict TEXT NOT NULL CHECK (verdict IN ('RESOLUTION_CONSISTENT', 'POTENTIALLY_UNRESOLVED', 'HUMAN_REVIEW_REQUIRED')),
  confidence DOUBLE PRECISION,
  explanation TEXT,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Citizen Verifications & Dispute Submissions
CREATE TABLE IF NOT EXISTS public.citizen_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_satisfied BOOLEAN NOT NULL, -- true: CLOSED, false: DISPUTED
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  dispute_photo_url TEXT, -- Mandatory if is_satisfied = false
  dispute_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Recurring Complaint Clusters
CREATE TABLE IF NOT EXISTS public.complaint_clusters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION NOT NULL DEFAULT 500,
  complaint_count INTEGER NOT NULL DEFAULT 1,
  complaint_ids JSONB DEFAULT '[]'::jsonb,
  ai_insight TEXT,
  root_cause_hypothesis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Department Performance Scores
CREATE TABLE IF NOT EXISTS public.department_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  sla_compliance_rate DOUBLE PRECISION,
  resolution_rate DOUBLE PRECISION,
  reopen_rate DOUBLE PRECISION,
  escalation_rate DOUBLE PRECISION,
  avg_resolution_hours DOUBLE PRECISION,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. In-App User Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Comprehensive Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- AUTOMATED TRIGGERS & FUNCTIONS
-- ============================================================

-- 1. Sync Supabase auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'citizen'::public.user_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Permanent Complaint ID Generator (Format: CR-YYYY-XXXXXX)
CREATE OR REPLACE FUNCTION public.generate_complaint_id()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  next_seq INT;
  new_id TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Acquire an advisory lock to prevent race conditions during concurrent submissions
  PERFORM pg_advisory_xact_lock(hash_text('complaint_id_lock'));
  
  SELECT COALESCE(MAX(SUBSTRING(permanent_id FROM 9)::INT), 0) + 1
  INTO next_seq
  FROM public.complaints
  WHERE permanent_id LIKE 'CR-' || current_year || '-%';

  new_id := 'CR-' || current_year || '-' || LPAD(next_seq::TEXT, 6, '0');
  NEW.permanent_id := new_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_complaint_insert ON public.complaints;
CREATE TRIGGER before_complaint_insert
  BEFORE INSERT ON public.complaints
  FOR EACH ROW
  WHEN (NEW.permanent_id IS NULL)
  EXECUTE FUNCTION public.generate_complaint_id();

-- 3. Log Status Transitions Automatically to Audit History
CREATE OR REPLACE FUNCTION public.log_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.complaint_status_history (
      complaint_id,
      old_status,
      new_status,
      updated_by,
      notes
    )
    VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
      NEW.status,
      COALESCE(auth.uid(), NEW.citizen_id),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Initial complaint submission'
        ELSE 'Status transitioned to ' || NEW.status::TEXT
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_complaint_status_update ON public.complaints;
CREATE TRIGGER on_complaint_status_update
  AFTER INSERT OR UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.log_status_transition();

-- ============================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON public.complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON public.complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_sla_deadline ON public.complaints(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_complaints_permanent_id ON public.complaints(permanent_id);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON public.complaint_status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON public.notifications(profile_id, is_read);
CREATE INDEX IF NOT EXISTS idx_images_complaint ON public.complaint_images(complaint_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Public lookup for system operations, update own profile
CREATE POLICY "Public profile lookup" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Departments & Categories: Read for all, manage for super admins
CREATE POLICY "Read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Super admin manage departments" ON public.departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Read categories" ON public.department_categories FOR SELECT USING (true);
CREATE POLICY "Super admin manage categories" ON public.department_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Officer Departments: Read for all authenticated, manage for admins
CREATE POLICY "Read officer departments" ON public.officer_departments FOR SELECT USING (true);
CREATE POLICY "Admin manage officer departments" ON public.officer_departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('dept_admin', 'super_admin'))
);

-- Complaints:
-- 1. Citizens see own complaints; Officers see department complaints; Admins see authorized complaints
CREATE POLICY "Complaints select policy" ON public.complaints FOR SELECT USING (
  citizen_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    LEFT JOIN public.officer_departments od ON od.profile_id = p.id
    WHERE p.id = auth.uid() AND (
      p.role = 'super_admin'
      OR (p.role IN ('officer', 'dept_admin') AND (od.department_id = complaints.department_id OR complaints.department_id IS NULL))
    )
  )
);

CREATE POLICY "Citizens can insert complaints" ON public.complaints FOR INSERT WITH CHECK (
  citizen_id = auth.uid()
);

CREATE POLICY "Staff can update complaints" ON public.complaints FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'dept_admin', 'super_admin')
  )
);

-- Complaint Images:
CREATE POLICY "Read complaint images" ON public.complaint_images FOR SELECT USING (true);
CREATE POLICY "Insert complaint images" ON public.complaint_images FOR INSERT WITH CHECK (true);

-- AI Analysis & Status History:
CREATE POLICY "Read ai analysis" ON public.complaint_ai_analysis FOR SELECT USING (true);
CREATE POLICY "Read status history" ON public.complaint_status_history FOR SELECT USING (true);

-- Resolution Submissions & Reports:
CREATE POLICY "Read resolution submissions" ON public.resolution_submissions FOR SELECT USING (true);
CREATE POLICY "Officers can insert resolution submissions" ON public.resolution_submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'dept_admin', 'super_admin'))
);
CREATE POLICY "Read resolution reports" ON public.resolution_reports FOR SELECT USING (true);
CREATE POLICY "Officers can insert resolution reports" ON public.resolution_reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'dept_admin', 'super_admin'))
);

-- Verifications & SLA Events:
CREATE POLICY "Read ai verifications" ON public.ai_verifications FOR SELECT USING (true);
CREATE POLICY "Read citizen verifications" ON public.citizen_verifications FOR SELECT USING (true);
CREATE POLICY "Citizens can insert verifications" ON public.citizen_verifications FOR INSERT WITH CHECK (
  citizen_id = auth.uid()
);
CREATE POLICY "Read sla events" ON public.sla_events FOR SELECT USING (true);
CREATE POLICY "Read escalations" ON public.escalations FOR SELECT USING (true);
CREATE POLICY "Read complaint clusters" ON public.complaint_clusters FOR SELECT USING (true);
CREATE POLICY "Read department scores" ON public.department_scores FOR SELECT USING (true);

-- Notifications:
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (profile_id = auth.uid());

-- Audit Logs:
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('dept_admin', 'super_admin'))
);
