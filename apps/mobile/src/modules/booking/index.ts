import type { BookingError, UnifiedBooking } from '@longevity/shared';
import { CANCELLATION_WINDOWS } from '@longevity/shared';
import { supabase } from '../../lib/supabase';

export type { BookingError, UnifiedBooking };

export async function bookConsultation(slotId: string): Promise<{ data: { id: string } | null; error: BookingError | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { code: 'NETWORK_ERROR', message: 'Not authenticated' } };

  const channelName = `consult-${crypto.randomUUID()}`;

  // Atomically update slot to booked — only succeeds if currently open
  const { data: updatedSlots, error: slotError } = await supabase
    .from('consultation_slots')
    .update({ status: 'booked' })
    .eq('id', slotId)
    .eq('status', 'open')  // Only update if OPEN — prevents race condition
    .select('id');

  if (slotError) return { data: null, error: { code: 'NETWORK_ERROR', message: slotError.message } };
  if (!updatedSlots || updatedSlots.length === 0) return { data: null, error: { code: 'SLOT_TAKEN' } };

  // Slot secured — now insert the consultation
  const { data, error: consultError } = await supabase
    .from('consultations')
    .insert({
      patient_uuid: user.id,
      slot_id: slotId,
      agora_channel: channelName,
      video_type: 'agora',
    })
    .select('id')
    .single();

  if (consultError) {
    // Roll back the slot update
    await supabase.from('consultation_slots').update({ status: 'open' }).eq('id', slotId);
    return { data: null, error: { code: 'NETWORK_ERROR', message: consultError.message } };
  }

  return { data, error: null };
}

export async function bookTherapy(slotId: string): Promise<{ data: { id: string } | null; error: BookingError | null }> {
  const { data: slot } = await supabase
    .from('therapy_slots')
    .select('capacity, booked_count')
    .eq('id', slotId)
    .single();

  if (!slot || slot.booked_count >= slot.capacity) {
    return { data: null, error: { code: 'CAPACITY_FULL' } };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { code: 'NETWORK_ERROR', message: 'Not authenticated' } };

  const { data, error } = await supabase.from('therapy_bookings').insert({
    patient_uuid: user.id,
    therapy_slot_id: slotId,
  }).select('id').single();

  if (error) return { data: null, error: { code: 'NETWORK_ERROR', message: error.message } };

  await supabase.from('therapy_slots').update({ booked_count: slot.booked_count + 1 }).eq('id', slotId);

  return { data, error: null };
}

export async function cancelConsultation(consultationId: string): Promise<{ error: BookingError | null }> {
  const { data } = await supabase
    .from('consultations')
    .select('slot_id, status, consultation_slots(start_time)')
    .eq('id', consultationId)
    .single();

  if (!data) return { error: { code: 'NETWORK_ERROR', message: 'Not found' } };

  const slotData = (Array.isArray(data.consultation_slots) ? data.consultation_slots[0] : data.consultation_slots) as { start_time: string } | null;
  if (slotData) {
    const startTime = new Date(slotData.start_time).getTime();
    if (startTime - Date.now() < CANCELLATION_WINDOWS.consultation) {
      return { error: { code: 'CANCELLATION_WINDOW_PASSED' } };
    }
  }

  await Promise.all([
    supabase.from('consultations').update({ status: 'cancelled' }).eq('id', consultationId),
    supabase.from('consultation_slots').update({ status: 'open' }).eq('id', data.slot_id),
  ]);

  return { error: null };
}

export async function cancelTherapyBooking(bookingId: string): Promise<{ error: BookingError | null }> {
  const { data } = await supabase
    .from('therapy_bookings')
    .select('therapy_slot_id, therapy_slots(start_time)')
    .eq('id', bookingId)
    .single();

  if (!data) return { error: { code: 'NETWORK_ERROR', message: 'Not found' } };

  const slotData = (Array.isArray(data.therapy_slots) ? data.therapy_slots[0] : data.therapy_slots) as { start_time: string } | null;
  if (slotData) {
    const startTime = new Date(slotData.start_time).getTime();
    if (startTime - Date.now() < CANCELLATION_WINDOWS.therapy) {
      return { error: { code: 'CANCELLATION_WINDOW_PASSED' } };
    }
  }

  await Promise.all([
    supabase.from('therapy_bookings').update({ status: 'cancelled' }).eq('id', bookingId),
    supabase.from('therapy_slots').update({ booked_count: 0 }).eq('id', data.therapy_slot_id),
  ]);

  return { error: null };
}

export async function getMyBookings(): Promise<UnifiedBooking[]> {
  const [consultations, therapyBookings] = await Promise.all([
    supabase.from('consultations').select('*, slot:consultation_slots(*, physician:physicians(*))').neq('status', 'cancelled').order('created_at', { ascending: false }),
    supabase.from('therapy_bookings').select('*, therapy_slot:therapy_slots(*, therapy:therapies(*))').neq('status', 'cancelled').order('created_at', { ascending: false }),
  ]);

  const unified: UnifiedBooking[] = [];

  (consultations.data ?? []).forEach((c: any) => {
    unified.push({
      id: c.id,
      type: 'consultation',
      title: `Consultation with Dr. ${c.slot?.physician?.name ?? 'Physician'}`,
      startsAt: new Date(c.slot?.start_time ?? c.created_at),
      status: c.status,
      slotId: c.slot_id,
      raw: c,
    });
  });

  (therapyBookings.data ?? []).forEach((b: any) => {
    unified.push({
      id: b.id,
      type: 'therapy',
      title: b.therapy_slot?.therapy?.name ?? 'Therapy Session',
      startsAt: new Date(b.therapy_slot?.start_time ?? b.created_at),
      status: b.status,
      slotId: b.therapy_slot_id,
      raw: b,
    });
  });

  return unified.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
