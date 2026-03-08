-- =============================================================================
-- MIGRATION: Evaluation Flow Fixes
-- =============================================================================
-- 1. Allow evaluator to update their own participant status (for submit flow)
-- 2. Change competency_id from UUID to TEXT (constants use string IDs)
-- =============================================================================

-- 1. RLS: Evaluator can update status of their own participant record
-- The existing "participants_manage" policy only allows admin/people,
-- but when an employee submits their evaluation, they need to update
-- their own participant record status to 'completed'.
CREATE POLICY "participants_evaluator_update_own" ON public.evaluation_participants
  FOR UPDATE TO authenticated USING (
    evaluator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.evaluation_cycles c
      WHERE c.id = evaluation_participants.cycle_id
      AND is_same_org(c.organization_id)
    )
  )
  WITH CHECK (
    evaluator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.evaluation_cycles c
      WHERE c.id = evaluation_participants.cycle_id
      AND is_same_org(c.organization_id)
    )
  );

-- 2. Alter competency_id from UUID to TEXT
-- The constants in the frontend use string IDs like "comunicacao", "dev-git"
-- instead of UUIDs. This makes the column compatible with those values.
ALTER TABLE public.evaluation_responses
  ALTER COLUMN competency_id TYPE TEXT USING competency_id::TEXT;
