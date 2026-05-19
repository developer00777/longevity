CREATE TABLE public.therapies (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT    NOT NULL,
  description  TEXT,
  duration_min INT,
  pricing_tier TEXT    DEFAULT 'membership' CHECK (pricing_tier IN ('membership','addon')),
  booking_type TEXT    DEFAULT 'slot' CHECK (booking_type IN ('slot','class','consultation')),
  active       BOOLEAN DEFAULT true
);

ALTER TABLE public.therapies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapies_read_active_authenticated" ON public.therapies
  FOR SELECT USING (active = true AND auth.role() = 'authenticated');

CREATE POLICY "therapies_admin_all" ON public.therapies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.uuid = auth.uid() AND au.role IN ('admin','staff'))
  );
