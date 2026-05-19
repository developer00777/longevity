CREATE TABLE public.health_metrics (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid         UUID    NOT NULL REFERENCES public.users(uuid) ON DELETE CASCADE,
  metric_type  TEXT    NOT NULL CHECK (metric_type IN ('steps','heart_rate','sleep','calories')),
  value        NUMERIC NOT NULL,
  recorded_at  DATE    NOT NULL,
  source       TEXT    NOT NULL CHECK (source IN ('apple','google')),
  UNIQUE (uuid, metric_type, recorded_at, source)
);

ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_select_own" ON public.health_metrics
  FOR SELECT USING (auth.uid() = uuid);

CREATE POLICY "health_insert_own" ON public.health_metrics
  FOR INSERT WITH CHECK (auth.uid() = uuid);
