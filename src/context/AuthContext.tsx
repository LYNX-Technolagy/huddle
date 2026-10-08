// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as authLib from '../lib/auth';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** null = still checking, true = onboarded, false = needs onboarding */
  onboarded: boolean | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (params: authLib.SignUpParams) => Promise<{ error: Error | null }>;
  resendVerification: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /** Call after onboarding completes to flip the flag without a full reload */
  markOnboarded: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Fetch the onboarded flag for a given user ----
  const fetchOnboarded = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Profile row should exist (trigger creates it on signup).
      // If it doesn't yet, treat as not onboarded.
      setOnboarded(false);
      return;
    }
    setOnboarded(!!data.onboarded_at);
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data.session;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        fetchOnboarded(s.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setOnboarded(false);
        setLoading(false);
      }
    });

    // 2. Auth state changes
    const unsubscribe = authLib.onAuthChange(async (newSession) => {
      if (!mounted) return;

      const prevUserId = user?.id;
      const nextUserId = newSession?.user?.id ?? null;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (!newSession?.user) {
        setOnboarded(false);
        return;
      }

      // Only re-fetch if the user actually changed (avoids
      // a network call on every token refresh).
      if (prevUserId !== nextUserId || onboarded === null) {
        await fetchOnboarded(newSession.user.id);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await authLib.signIn({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (params: authLib.SignUpParams) => {
    const { error } = await authLib.signUp(params);
    return { error };
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    return await authLib.resendVerification(email);
  }, []);

  const signOut = useCallback(async () => {
    await authLib.signOut();
    setOnboarded(false);
  }, []);

  const markOnboarded = useCallback(() => {
    setOnboarded(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        onboarded,
        loading,
        signIn,
        signUp,
        resendVerification,
        signOut,
        markOnboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}