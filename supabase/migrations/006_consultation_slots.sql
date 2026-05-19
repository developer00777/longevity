CREATE TABLE public.consultation_slots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physician_uuid UUID NOT NULL REFERENCES public.physicians(uuid) ON DELETE CASCADE,
  start_time     TIMESTAMPTZ NOT NULL,
  end_time       TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','booked','blocked','completed'))
);

ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slots_read_authenticated" ON public.consultation_slots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "slots_admin_all" ON public.consultation_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid())
  );
