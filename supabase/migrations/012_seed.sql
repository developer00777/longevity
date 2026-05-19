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
