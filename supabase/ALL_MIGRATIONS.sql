-- ================================================================
-- Longevity Platform — Combined Migrations
-- Run this ONCE in Supabase SQL Editor: supabase.com/dashboard/project/qwxdowvusuchqhoackoe/sql/new
-- ================================================================

-- ── 001_extensions.sql ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ── 002_users.sql ──────────────────────────────────────────
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


-- ── 003_health_metrics.sql ──────────────────────────────────────────
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


-- ── 004_physicians.sql ──────────────────────────────────────────
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


-- ── 005_admin_users.sql ──────────────────────────────────────────
CREATE TABLE public.admin_users (
  uuid                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                  TEXT NOT NULL CHECK (role IN ('admin','physician','staff')),
  linked_physician_uuid UUID REFERENCES public.physicians(uuid)
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_users_read_own" ON public.admin_users
  FOR SELECT USING (auth.uid() = uuid);
CREATE POLICY "admin_users_read_all_by_admin" ON public.admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.uuid = auth.uid() AND au.role = 'admin')
  );


-- ── 006_consultation_slots.sql ──────────────────────────────────────────
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


-- ── 007_consultations.sql ──────────────────────────────────────────
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


-- ── 008_therapies.sql ──────────────────────────────────────────
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


-- ── 009_rooms.sql ──────────────────────────────────────────
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


-- ── 010_therapy_slots.sql ──────────────────────────────────────────
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


-- ── 011_therapy_bookings.sql ──────────────────────────────────────────
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


-- ── 012_seed.sql ──────────────────────────────────────────
INSERT INTO public.rooms (name, capacity) VALUES
  ('Red Light Chamber', 2),
  ('CRYONiQ Chamber', 1),
  ('Recovery Pod A', 1),
  ('Recovery Pod B', 1),
  ('Breathwork Studio', 10),
  ('IV Drip Bay', 4),
  ('Hyperbaric Chamber', 1),
  ('Cold Plunge Area', 3),
  ('Physio Room', 2),
  ('Consultation Room A', 1),
  ('Consultation Room B', 1);

INSERT INTO public.therapies (name, description, duration_min, pricing_tier, booking_type) VALUES
  ('Red Light Therapy', 'Red and near-infrared light for mitochondrial function, recovery, skin health, collagen production, wound healing, muscle recovery, inflammation reduction, sleep regulation, and pain management.', 30, 'membership', 'slot'),
  ('Cryotherapy', 'Whole-body or localized cold exposure (CRYONiQ) for inflammation reduction, muscle soreness, pain relief, recovery, circulation, alertness, and mood enhancement.', 15, 'membership', 'slot'),
  ('Neuro Relaxation', 'Neuroacoustic therapy, guided meditation, vagus nerve stimulation, brainwave entrainment for stress management, ANS balance, burnout reduction, and sleep optimization.', 45, 'membership', 'slot'),
  ('Aromatherapy & Sound Healing', 'Essential oils plus sound frequencies, binaural beats, vibrational therapy for relaxation, mood enhancement, anxiety reduction, and meditation support.', 45, 'membership', 'slot'),
  ('Breathwork & Yoga', 'Breathwork, lung training, respiratory muscle strengthening, CO2 tolerance, VO2 improvement, stress reduction, and athletic endurance.', 60, 'membership', 'class'),
  ('IV Nutrition / Longevity Drip', 'IV delivery of vitamins, minerals, amino acids, antioxidants, NAD+, glutathione for hydration, fatigue recovery, nutrient replenishment, and wellness optimization.', 60, 'addon', 'slot'),
  ('Hyperbaric Oxygen Chamber', 'Oxygen under increased pressure for wound healing, recovery, cognitive support, tissue repair, and performance recovery.', 60, 'addon', 'slot'),
  ('Ice Bath / Cold Plunge / Steam', 'Contrast thermotherapy for circulation, muscle recovery, stress adaptation, cardiovascular conditioning, and ANS conditioning.', 30, 'membership', 'slot'),
  ('Physiotherapy', 'Mobility, muscle preservation, joint function, posture, pain-free aging, movement quality, and strength maintenance.', 60, 'addon', 'slot'),
  ('Diet Therapy Consultation', 'Nutrition programs via Lami.fit: weight loss, fat loss, muscle preservation, PCOS, diabetes reversal, gut health, anti-inflammatory, menopause support, sports nutrition, and healthy aging.', 60, 'addon', 'consultation'),
  ('Cognitive Therapy', 'Cognitive rehabilitation and brain training via COGBAT: memory, attention, focus, executive function, processing speed, and problem-solving.', 60, 'addon', 'slot');


-- ── 013_noshow_and_rls_fix.sql ──────────────────────────────────────────
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


-- ── 014_rls_with_check_fix.sql ───────────────────────────────────────────────
-- RLS INSERT policies were missing WITH CHECK clauses — Supabase requires
-- explicit WITH CHECK for INSERT/UPDATE or the operation is blocked.

DROP POLICY IF EXISTS "therapy_slots_admin_all" ON public.therapy_slots;
CREATE POLICY "therapy_slots_admin_all" ON public.therapy_slots
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid()));

DROP POLICY IF EXISTS "slots_admin_all" ON public.consultation_slots;
CREATE POLICY "slots_admin_all" ON public.consultation_slots
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid()));

DROP POLICY IF EXISTS "therapy_bookings_staff_all" ON public.therapy_bookings;
CREATE POLICY "therapy_bookings_staff_all" ON public.therapy_bookings
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE uuid = auth.uid()));

