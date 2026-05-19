import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAdminAuthStore } from '../stores/auth.store';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

export function PhysicianSchedulePage() {
  const navigate = useNavigate();
  const { adminUser } = useAdminAuthStore();
  const physicianId = adminUser?.linked_physician_uuid;

  const { data: todaySlots, isLoading } = useQuery({
    queryKey: ['physician-schedule-today', physicianId],
    enabled: !!physicianId,
    queryFn: async () => {
      // Query slots for this physician in next 7 days
      const { data: slots } = await supabase
        .from('consultation_slots')
        .select('id, start_time, end_time, status')
        .eq('physician_uuid', physicianId!)
        .gte('start_time', startOfDay(new Date()).toISOString())
        .lte('start_time', endOfDay(addDays(new Date(), 7)).toISOString())
        .order('start_time');

      if (!slots?.length) return [];

      // For booked slots, fetch the consultation + patient separately
      const bookedSlotIds = slots.filter(s => s.status === 'booked').map(s => s.id);
      let consultationMap: Record<string, any> = {};

      if (bookedSlotIds.length > 0) {
        const { data: consultations } = await supabase
          .from('consultations')
          .select('id, slot_id, status, patient_uuid')
          .in('slot_id', bookedSlotIds)
          .neq('status', 'cancelled');

        if (consultations?.length) {
          const patientIds = consultations.map(c => c.patient_uuid).filter(Boolean);
          let patients: Record<string, any> = {};

          if (patientIds.length) {
            const { data: usersData } = await supabase
              .from('users')
              .select('uuid, name, age, health_goals')
              .in('uuid', patientIds);
            (usersData ?? []).forEach((u: any) => { patients[u.uuid] = u; });
          }

          consultations.forEach((c: any) => {
            consultationMap[c.slot_id] = { ...c, patient: patients[c.patient_uuid] ?? null };
          });
        }
      }

      return slots.map(slot => ({
        ...slot,
        consultation: consultationMap[slot.id] ?? null,
      }));
    },
  });

  const { data: upcomingCount } = useQuery({
    queryKey: ['physician-upcoming-count', physicianId],
    enabled: !!physicianId,
    queryFn: async () => {
      const { count } = await supabase
        .from('consultation_slots')
        .select('*', { count: 'exact', head: true })
        .eq('physician_uuid', physicianId!)
        .eq('status', 'booked')
        .gte('start_time', new Date().toISOString());
      return count ?? 0;
    },
  });

  if (!physicianId) {
    return (
      <Card style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Physician profile not linked</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Ask your admin to link your account to a physician profile.
        </div>
      </Card>
    );
  }

  const todayItems = todaySlots?.filter(s => isToday(new Date(s.start_time))) ?? [];
  const upcomingItems = todaySlots?.filter(s => !isToday(new Date(s.start_time))) ?? [];

  function dayLabel(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE, MMM d');
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>My Schedule</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Next 7 days · {format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: "Today's Slots", value: todayItems.length, icon: '📅' },
          { label: 'Booked (7d)', value: upcomingCount ?? 0, icon: '🩺' },
          { label: 'Open Today', value: todayItems.filter(s => s.status === 'open').length, icon: '🟢' },
        ].map(stat => (
          <Card key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>{stat.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', marginTop: 8 }}>{stat.value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button label="+ Add Slots" onClick={() => navigate('/physician/slots')} />
      </div>

      {isLoading && <Spinner />}

      {/* Today */}
      {todayItems.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>Today</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayItems.map((slot: any) => {
              const consultation = slot.consultation;
              const patient = consultation?.patient;
              return (
                <Card key={slot.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>
                        {format(new Date(slot.start_time), 'h:mm a')} – {format(new Date(slot.end_time), 'h:mm a')}
                      </div>
                      {patient ? (
                        <>
                          <div style={{ color: 'var(--text)', fontSize: 14, marginTop: 4 }}>{patient.name}</div>
                          {patient.health_goals?.length > 0 && (
                            <div style={{ color: 'var(--primary)', fontSize: 12, marginTop: 4 }}>
                              Goals: {patient.health_goals.join(', ')}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>No booking yet</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge status={slot.status} />
                      {consultation && (
                        <Button label="Open Consult" onClick={() => navigate(`/consult/${consultation.id}`)} style={{ height: 32, padding: '0 12px', fontSize: 12 }} />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingItems.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Upcoming (next 7 days)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingItems.map((slot: any) => {
              const consultation = slot.consultation;
              return (
                <Card key={slot.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{dayLabel(slot.start_time)}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
                        {format(new Date(slot.start_time), 'h:mm a')} – {format(new Date(slot.end_time), 'h:mm a')}
                      </div>
                      {consultation?.patient?.name && (
                        <div style={{ color: 'var(--primary)', fontSize: 13, marginTop: 2 }}>{consultation.patient.name}</div>
                      )}
                    </div>
                    <Badge status={slot.status} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && todaySlots?.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 16 }}>No slots in the next 7 days</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8, marginBottom: 20 }}>
            Add your availability so patients can book consultations
          </div>
          <Button label="+ Create Slots" onClick={() => navigate('/physician/slots')} />
        </Card>
      )}
    </div>
  );
}
