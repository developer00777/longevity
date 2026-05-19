import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '@longevity/shared';
import { supabase } from '../lib/supabase';

type AuthState = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  loadSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),

  loadSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, loading: false });
      if (session) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('uuid', session.user.id)
          .maybeSingle();
        set({ profile: data ?? null });
      }
    } catch {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
