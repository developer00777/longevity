CREATE TABLE public.therapy_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid    UUID NOT NULL REFERENCES public.users(uuid) ON DELETE CASCADE,
  therapy_slot_id UUID NOT NULL REFERENCES public.therapy_slots(id),
  status          TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','completed','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.therapy_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapy_bookings_select_own" ON public.therapy_bookings
  FOR SELECT USING (auth.uid() = patient_uuid);

CREATE POLICY "therapy_bookings_insert_own" ON public.therapy_bookings
  FOR INSERT WITH CHECK (auth.uid() = patient_uuid);

CREATE POLICY "therapy_bookings_update_own" ON public.therapy_bookings
  FOR UPDATE USING (auth.uid() = patient_uuid);

CREATE POLICY "therapy_bookings_staff_all" ON public.therapy_bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid())
  );
