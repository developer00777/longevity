-- ── No-show detection function ───────────────────────────────────────────────
-- Marks consultations as no_show when patient hasn't joined within 10 min.
-- Called by a pg_cron job every minute (set up in Supabase dashboard).
CREATE OR REPLACE FUNCTION mark_noshow_consultations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE consultations
  SET status = 'no_show'
  WHERE
    status = 'upcoming'
    AND slot_id IN (
      SELECT id FROM consultation_slots
      WHERE start_time < now() - interval '10 minutes'
        AND status = 'booked'
    );

  -- Free up the slot so it can be recycled
  UPDATE consultation_slots
  SET status = 'completed'
  WHERE
    status = 'booked'
    AND start_time < now() - interval '10 minutes'
    AND id IN (
      SELECT slot_id FROM consultations
      WHERE status IN ('no_show', 'completed', 'cancelled')
    );
END;
$$;

-- ── Fix: physician can read health metrics for their booked patients ──────────
-- This policy was missing from migration 003 (circular dependency on consultations).
-- Safe to add now that consultations table exists.
DO $$
BEGIN
  -- Drop if exists to allow re-run
  DROP POLICY IF EXISTS "health_select_physician" ON public.health_metrics;
END $$;

CREATE POLICY "health_select_physician" ON public.health_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.consultations c
      JOIN public.consultation_slots cs ON c.slot_id = cs.id
      WHERE
        c.patient_uuid = health_metrics.uuid
        AND cs.physician_uuid = auth.uid()
        AND c.status IN ('upcoming', 'completed')
    )
  );

-- ── Consultation completed trigger ───────────────────────────────────────────
-- Auto-marks slot as completed when consultation status moves to completed.
CREATE OR REPLACE FUNCTION sync_slot_on_consultation_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IN ('completed', 'cancelled', 'no_show') AND OLD.status = 'upcoming' THEN
    UPDATE consultation_slots
    SET status = CASE
      WHEN NEW.status = 'completed' THEN 'completed'
      ELSE 'open'  -- cancelled/no_show frees the slot
    END
    WHERE id = NEW.slot_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_slot ON public.consultations;

CREATE TRIGGER trg_sync_slot
  AFTER UPDATE OF status ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION sync_slot_on_consultation_complete();
