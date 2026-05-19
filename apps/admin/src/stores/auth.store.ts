import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { AdminUser } from '@longevity/shared';
import { supabase } from '../lib/supabase';

type AuthState = {
  session: Session | null;
  adminUser: AdminUser | null;
  loading: boolean;
  setSession: (s: Session | null) => void;
  loadSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAdminAuthStore = create<AuthState>((set) => ({
  session: null,
  adminUser: null,
  loading: true,

  setSession: (session) => set({ session }),

  loadSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, loading: false });
    if (session) {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('uuid', session.user.id)
        .maybeSingle();
      set({ adminUser: data ?? null });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, adminUser: null });
  },
}));
