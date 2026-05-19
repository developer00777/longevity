CREATE TABLE public.users (
  uuid             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  age              INT  CHECK (age >= 18),
  gender           TEXT CHECK (gender IN ('male','female','other')),
  height_cm        NUMERIC,
  weight_kg        NUMERIC,
  health_goals     TEXT[] DEFAULT '{}',
  consent_given_at TIMESTAMPTZ,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = uuid);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = uuid);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = uuid);
