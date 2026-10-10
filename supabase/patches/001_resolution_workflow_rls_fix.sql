-- ============================================================
-- PATCH: Missing RLS Policies for Resolution Workflow
-- Run this in the Supabase SQL Editor or apply as a migration
-- ============================================================

-- 1. complaint_status_history — Missing INSERT policy
-- Staff (officer, admin) and server-side service role need to insert history entries.
-- The service role bypasses RLS entirely, but anon/authenticated officers need this.
CREATE POLICY IF NOT EXISTS "Staff can insert status history" ON public.complaint_status_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('officer', 'dept_admin', 'super_admin')
    )
  );

-- Also allow system inserts where updated_by is null (AI verification, trigger-inserted)
-- The service role bypasses this automatically; this policy covers officer-session inserts.

-- 2. ai_verifications — Missing INSERT policy
-- AI verifications are inserted by the service role (bypasses RLS), but add a safety net.
CREATE POLICY IF NOT EXISTS "Service can insert ai verifications" ON public.ai_verifications
  FOR INSERT WITH CHECK (true);

-- 3. citizen_verifications — Ensure citizens can INSERT their own verifications
-- Already exists: "Citizens can insert verifications" — verify it's correct
-- citizens can insert: citizen_id = auth.uid() (already in schema.sql)

-- 4. complaint_images — Already open (INSERT WITH CHECK (true)) — no change needed.

-- 5. resolution_submissions — Need INSERT/UPDATE policy for officers.
-- "Officers can insert resolution submissions" already exists but we need UPDATE for upsert.
CREATE POLICY IF NOT EXISTS "Officers can update resolution submissions" ON public.resolution_submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'dept_admin', 'super_admin'))
  );

-- 6. resolution_reports — Need UPDATE policy for upsert.
CREATE POLICY IF NOT EXISTS "Officers can update resolution reports" ON public.resolution_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'dept_admin', 'super_admin'))
  );

-- 7. complaints — Allow citizens to update ONLY status for their own complaints
-- when transitioning via verification. Restricted to specific target statuses.
-- NOTE: Application code validates ownership before calling update, but this
-- adds a defense-in-depth layer. The service role bypasses this automatically.
CREATE POLICY IF NOT EXISTS "Citizens can update complaint status on verification" ON public.complaints
  FOR UPDATE USING (
    citizen_id = auth.uid()
  )
  WITH CHECK (
    citizen_id = auth.uid()
    AND status IN ('CLOSED', 'DISPUTED')
  );
