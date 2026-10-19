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
import { consumeSessionFromUrl } from '../lib/session';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ProfileState {
  hasSports: boolean;
  hasLocation: boolean;
  hasRank: boolean;
  /** True when all profile fields needed for a good experience are set */
  isComplete: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** null while still loading, then the derived profile state */
  profileState: ProfileState | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (params: authLib.SignUpParams) => Promise<{ error: Error | null }>;
  resendVerification: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /** Call after profile edits to refresh the completion state */
  refreshProfileState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Fetch profile state ----
  const fetchProfileState = useCallback(async (userId: string) => {
    const [profileRes, sportsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('rank, location, city')
        .eq('id', userId)
        .single(),
      supabase
        .from('user_sports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    const hasRank = !!profileRes.data?.rank;
    const hasLocation =
      !!profileRes.data?.location || !!profileRes.data?.city;
    const hasSports = (sportsRes.count ?? 0) > 0;

    setProfileState({
      hasSports,
      hasLocation,
      hasRank,
      isComplete: hasSports && hasLocation && hasRank,
    });
  }, []);

  // ---- Initial session ----
  useEffect(() => {
    let mounted = true;

    (async () => {
      // IMPORTANT: before we ask Supabase for the session, check whether the
      // user landed here from an email verification link. If they did, that
      // link contains tokens in the URL fragment which we need to consume
      // before getSession() is called — otherwise the app treats them as
      // logged out and asks them to log in again.
      await consumeSessionFromUrl();

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const s = data.session;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        await fetchProfileState(s.user.id);
      } else {
        setProfileState(null);
      }

      if (mounted) setLoading(false);
    })();

    const unsubscribe = authLib.onAuthChange(async (newSession) => {
      if (!mounted) return;

      const prevUserId = user?.id;
      const nextUserId = newSession?.user?.id ?? null;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (!newSession?.user) {
        setProfileState(null);
        return;
      }

      if (prevUserId !== nextUserId || profileState === null) {
        await fetchProfileState(newSession.user.id);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Exposed actions ----
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
    setProfileState(null);
  }, []);

  const refreshProfileState = useCallback(async () => {
    if (!user) return;
    await fetchProfileState(user.id);
  }, [user, fetchProfileState]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profileState,
        loading,
        signIn,
        signUp,
        resendVerification,
        signOut,
        refreshProfileState,
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