CREATE TABLE public.therapy_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapy_id   UUID NOT NULL REFERENCES public.therapies(id) ON DELETE CASCADE,
  room_id      UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  start_time   TIMESTAMPTZ NOT NULL,
  capacity     INT NOT NULL DEFAULT 1,
  booked_count INT NOT NULL DEFAULT 0 CHECK (booked_count >= 0)
);

ALTER TABLE public.therapy_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapy_slots_read_authenticated" ON public.therapy_slots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "therapy_slots_admin_all" ON public.therapy_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid())
  );
