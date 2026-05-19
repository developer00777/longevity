import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';

export function PatientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['admin-patients'],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').is('deleted_at', null).order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const filtered = patients?.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Patients</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>All registered users</p>
      </div>

      <input
        placeholder="Search by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 20, maxWidth: 400 }}
      />

      {isLoading && <Spinner />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((p: any) => (
          <Card key={p.uuid} style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients/${p.uuid}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#000' }}>
                  {p.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                    {p.age ? `${p.age} yrs` : ''} {p.gender ? `· ${p.gender}` : ''}
                  </div>
                  {p.health_goals?.length > 0 && (
                    <div style={{ color: 'var(--primary)', fontSize: 12, marginTop: 4 }}>{p.health_goals.join(' · ')}</div>
                  )}
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>›</span>
            </div>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <Card><p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>No patients found</p></Card>
        )}
      </div>
    </div>
  );
}
