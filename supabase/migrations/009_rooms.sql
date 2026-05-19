CREATE TABLE public.rooms (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL,
  capacity INT  NOT NULL DEFAULT 1
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_read_authenticated" ON public.rooms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "rooms_admin_all" ON public.rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid())
  );
