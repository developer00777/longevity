CREATE TABLE public.consultations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid            UUID REFERENCES public.users(uuid) ON DELETE SET NULL,
  slot_id                 UUID NOT NULL REFERENCES public.consultation_slots(id),
  video_type              TEXT DEFAULT 'agora' CHECK (video_type IN ('agora','zoom')),
  agora_channel           TEXT,
  video_link              TEXT,
  notes                   TEXT,
  recommended_therapy_ids UUID[] DEFAULT '{}',
  reschedule_count        INT  DEFAULT 0,
  status                  TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','completed','cancelled','no_show')),
  created_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultations_select_own" ON public.consultations
  FOR SELECT USING (auth.uid() = patient_uuid);

CREATE POLICY "consultations_select_physician" ON public.consultations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.consultation_slots cs
      WHERE cs.id = slot_id AND cs.physician_uuid = auth.uid()
    )
  );

CREATE POLICY "consultations_insert_own" ON public.consultations
  FOR INSERT WITH CHECK (auth.uid() = patient_uuid);

CREATE POLICY "consultations_update_own" ON public.consultations
  FOR UPDATE USING (auth.uid() = patient_uuid);

CREATE POLICY "consultations_update_physician" ON public.consultations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.consultation_slots cs
      WHERE cs.id = slot_id AND cs.physician_uuid = auth.uid()
    )
  );

CREATE POLICY "consultations_admin_all" ON public.consultations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid())
  );
