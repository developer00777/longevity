export type UserProfile = {
  uuid: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  weight_kg: number | null;
  health_goals: string[];
  consent_given_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type Physician = {
  uuid: string;
  name: string;
  specialization: string | null;
  bio: string | null;
  photo_url: string | null;
};

export type ConsultationSlot = {
  id: string;
  physician_uuid: string;
  start_time: string;
  end_time: string;
  status: 'open' | 'booked' | 'blocked' | 'completed';
  physician?: Physician;
};

export type Consultation = {
  id: string;
  patient_uuid: string;
  slot_id: string;
  video_type: 'agora' | 'zoom';
  agora_channel: string | null;
  video_link: string | null;
  notes: string | null;
  recommended_therapy_ids: string[];
  reschedule_count: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
  slot?: ConsultationSlot;
};

export type Therapy = {
  id: string;
  name: string;
  description: string | null;
  duration_min: number | null;
  pricing_tier: 'membership' | 'addon';
  booking_type: 'slot' | 'class' | 'consultation';
  active: boolean;
};

export type Room = {
  id: string;
  name: string;
  capacity: number;
};

export type TherapySlot = {
  id: string;
  therapy_id: string;
  room_id: string;
  start_time: string;
  capacity: number;
  booked_count: number;
  therapy?: Therapy;
  room?: Room;
};

export type TherapyBooking = {
  id: string;
  patient_uuid: string;
  therapy_slot_id: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
  therapy_slot?: TherapySlot;
};

export type AdminUser = {
  uuid: string;
  role: 'admin' | 'physician' | 'staff';
  linked_physician_uuid: string | null;
};

export type HealthMetric = {
  id: string;
  uuid: string;
  metric_type: 'steps' | 'heart_rate' | 'sleep' | 'calories';
  value: number;
  recorded_at: string;
  source: 'apple' | 'google';
};
