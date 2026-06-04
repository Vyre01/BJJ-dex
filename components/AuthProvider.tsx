'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/flag';
import { MOCK_USER } from '@/lib/mock/user';

type AuthState = { user: User | null; loading: boolean };

const AuthCtx = createContext<AuthState>({ user: null, loading: true });

export function useAuth() {
  return useContext(AuthCtx);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    if (isMockMode()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ user: MOCK_USER, loading: false });
      return;
    }
    const supabase = createClient();
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setState({ user: data.user, loading: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setState({ user: session?.user ?? null, loading: false });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}
