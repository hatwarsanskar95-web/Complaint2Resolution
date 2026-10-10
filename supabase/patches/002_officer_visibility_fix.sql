-- ============================================================
-- Phase 48 — Fix Officer Complaint Visibility
-- Root cause: departments + officer_departments tables were empty,
-- and executeSmartRouting was using citizen JWT which was blocked
-- by UPDATE RLS on complaints table.
-- ============================================================

-- 1. Re-seed 6 canonical departments (idempotent upsert)
INSERT INTO public.departments (id, name, code) VALUES
  ('47f60f28-429e-4cfc-adc1-c048d33eed7d', 'Water Management',     'WTR'),
  ('267d6dc4-1f7a-499e-b8aa-26668e9ce320', 'Roads / Public Works',  'RDS'),
  ('f4833006-3356-4bf6-9d95-0d81944872a8', 'Sanitation',            'SAN'),
  ('6359ef5c-27e4-4200-a1bb-bc6f609b8486', 'Electrical',            'ELE'),
  ('56c0b101-06a0-4a82-a962-bda1281922db', 'Drainage',              'DRN'),
  ('73730a2f-ac6f-449d-942f-cdb2f99a65d9', 'Parks & Recreation',    'PRK')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- 2. Re-link officer profiles to their departments (idempotent)
-- (These profile UUIDs match auth.users.id from the production database)
INSERT INTO public.officer_departments (profile_id, department_id) VALUES
  ('0e10dbe0-400f-4e81-a733-9c55c21e2f59', '47f60f28-429e-4cfc-adc1-c048d33eed7d'), -- Rajesh Kumar → Water Management
  ('3f0eb68c-562a-4554-9602-0c709640c823', '267d6dc4-1f7a-499e-b8aa-26668e9ce320'), -- Priya Sharma → Roads / Public Works
  ('13e92d22-be98-4aea-bd6c-c500c6e64710', 'f4833006-3356-4bf6-9d95-0d81944872a8'), -- Neha Gupta → Sanitation
  ('3035c647-254a-4397-bcdc-7952ae35066d', '6359ef5c-27e4-4200-a1bb-bc6f609b8486'), -- Amit Verma → Electrical
  ('f29ac5d0-a009-4bc0-aff6-f7360ef8a930', '56c0b101-06a0-4a82-a962-bda1281922db'), -- Suresh Patel → Drainage
  ('467cdf8b-2f72-472c-90da-7736128cc364', '73730a2f-ac6f-449d-942f-cdb2f99a65d9')  -- Kavita Singh → Parks & Recreation
ON CONFLICT DO NOTHING;

-- 3. SECURITY DEFINER function: route_complaint
--    Allows a citizen to route their OWN complaint by bypassing the
--    officer-only UPDATE RLS on the complaints table.
--    Also records status history (officer-only INSERT RLS bypassed).
CREATE OR REPLACE FUNCTION public.route_complaint(
  p_complaint_id       UUID,
  p_department_id      UUID,
  p_priority           TEXT,
  p_status             TEXT,
  p_sla_start_time     TIMESTAMPTZ,
  p_sla_duration_hours INTEGER,
  p_sla_deadline       TIMESTAMPTZ,
  p_routing_reason     TEXT,
  p_updated_by         UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status TEXT;
BEGIN
  -- Authorization: citizen who owns the complaint OR staff
  IF NOT (
    EXISTS (SELECT 1 FROM complaints WHERE id = p_complaint_id AND citizen_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer', 'dept_admin', 'super_admin'))
  ) THEN
    RAISE EXCEPTION 'Not authorized to route this complaint';
  END IF;

  SELECT status INTO v_old_status FROM complaints WHERE id = p_complaint_id;

  UPDATE complaints
  SET
    department_id        = p_department_id,
    priority             = p_priority::complaint_priority,
    status               = p_status::complaint_status,
    sla_start_time       = p_sla_start_time,
    sla_duration_hours   = p_sla_duration_hours,
    sla_deadline         = p_sla_deadline,
    updated_at           = NOW()
  WHERE id = p_complaint_id;

  INSERT INTO complaint_status_history (complaint_id, old_status, new_status, updated_by, notes)
  VALUES (p_complaint_id, v_old_status::complaint_status, p_status::complaint_status, p_updated_by, p_routing_reason);
END;
$$;

GRANT EXECUTE ON FUNCTION public.route_complaint TO authenticated;

-- 4. SECURITY DEFINER function: insert_ai_analysis
--    Allows citizen to insert AI analysis for their own complaint
--    (no citizen INSERT RLS policy exists on complaint_ai_analysis).
CREATE OR REPLACE FUNCTION public.insert_ai_analysis(
  p_complaint_id              UUID,
  p_category                  TEXT,
  p_subcategory               TEXT,
  p_department_recommendation TEXT,
  p_priority_recommendation   TEXT,
  p_summary                   TEXT,
  p_recommended_actions       JSONB,
  p_suggested_sla_hours       INTEGER,
  p_confidence                FLOAT,
  p_needs_human_review        BOOLEAN,
  p_raw_response              JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM complaints WHERE id = p_complaint_id AND citizen_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer', 'dept_admin', 'super_admin'))
  ) THEN
    RAISE EXCEPTION 'Not authorized to insert AI analysis for this complaint';
  END IF;

  INSERT INTO complaint_ai_analysis (
    complaint_id, category, subcategory, department_recommendation,
    priority_recommendation, summary, recommended_actions, suggested_sla_hours,
    confidence, needs_human_review, raw_response
  ) VALUES (
    p_complaint_id, p_category, p_subcategory, p_department_recommendation,
    p_priority_recommendation, p_summary, p_recommended_actions, p_suggested_sla_hours,
    p_confidence, p_needs_human_review, p_raw_response
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_ai_analysis TO authenticated;
