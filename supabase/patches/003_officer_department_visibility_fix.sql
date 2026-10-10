-- ============================================================
-- Phase 49 — Comprehensive Officer Department Visibility & Isolation Fix
--
-- 1. Helper function to fetch officer department IDs with SECURITY DEFINER
--    (eliminates RLS recursion and guarantees microsecond evaluation)
-- 2. Complaints SELECT policy allowing:
--    - Citizen owner
--    - Assigned officer
--    - Super admin
--    - Department officers via get_auth_officer_department_ids()
-- 3. Status History INSERT policy allowing citizens for their own complaints
-- ============================================================

-- 1. Create SECURITY DEFINER function to get authenticated officer department IDs
CREATE OR REPLACE FUNCTION public.get_auth_officer_department_ids()
RETURNS TABLE (department_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT od.department_id 
  FROM officer_departments od 
  WHERE od.profile_id = auth.uid();
$$;

-- 2. Update Complaints select policy with fast helper and officer direct assignment support
DROP POLICY IF EXISTS "Complaints select policy" ON public.complaints;

CREATE POLICY "Complaints select policy" ON public.complaints
FOR SELECT
TO public
USING (
  citizen_id = auth.uid()
  OR assigned_officer_id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'::user_role
  OR department_id IN (SELECT get_auth_officer_department_ids())
);

-- 3. Update status history insert policy to allow citizens for their own complaints
DROP POLICY IF EXISTS "Staff can insert status history" ON public.complaint_status_history;
DROP POLICY IF EXISTS "Allow status history insert" ON public.complaint_status_history;

CREATE POLICY "Allow status history insert" ON public.complaint_status_history
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
      AND profiles.role = ANY (ARRAY['officer'::user_role, 'dept_admin'::user_role, 'super_admin'::user_role])
  )
  OR EXISTS (
    SELECT 1 FROM complaints 
    WHERE complaints.id = complaint_status_history.complaint_id 
      AND complaints.citizen_id = auth.uid()
  )
);
