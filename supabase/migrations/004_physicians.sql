CREATE TABLE public.physicians (
  uuid           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  specialization TEXT,
  bio            TEXT,
  photo_url      TEXT
);

ALTER TABLE public.physicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "physicians_read_authenticated" ON public.physicians
  FOR SELECT USING (auth.role() = 'authenticated');
