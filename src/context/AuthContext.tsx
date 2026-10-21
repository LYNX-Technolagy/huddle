// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  isComplete: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profileState: ProfileState | null;
  loading: boolean;
  /** True when user is browsing without a session (guest mode) */
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (params: authLib.SignUpParams) => Promise<{ error: Error | null }>;
  resendVerification: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfileState: () => Promise<void>;
  /** Enter guest mode (persists across reloads) */
  continueAsGuest: () => Promise<void>;
  /** Clear guest flag when user chooses to sign in */
  exitGuestMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GUEST_STORAGE_KEY = 'huddle:guest-mode';

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const [isGuest, setIsGuest] = useState(false);
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

  // ---- Initial session + guest flag ----
  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1. Restore guest flag from storage
      try {
        const guestFlag = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        if (guestFlag === '1' && mounted) {
          setIsGuest(true);
        }
      } catch { }

      // 2. Consume any tokens from email link
      await consumeSessionFromUrl();

      // 3. Get session
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const s = data.session;
      setSession(s);
      setUser(s?.user ?? null);

      // Session takes priority over guest flag
      if (s?.user) {
        await fetchProfileState(s.user.id);
        // Clear guest flag if they somehow ended up with a session
        if (isGuest) {
          await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
          setIsGuest(false);
        }
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

      if (newSession?.user) {
        // Sign-in overrides guest mode
        await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
        setIsGuest(false);
      }

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

  // ---- Actions ----
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
    // Preserve guest flag on sign-out? No — clearer to reset to logged-out state.
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    setIsGuest(false);
  }, []);

  const refreshProfileState = useCallback(async () => {
    if (!user) return;
    await fetchProfileState(user.id);
  }, [user, fetchProfileState]);

  const continueAsGuest = useCallback(async () => {
    console.log('[AUTH] continueAsGuest CALLED');

    try {
      console.log('[AUTH] calling AsyncStorage.setItem...');
      await AsyncStorage.setItem(GUEST_STORAGE_KEY, '1');
      console.log('[AUTH] AsyncStorage.setItem RESOLVED');
    } catch (e: any) {
      console.error('[AUTH] AsyncStorage.setItem THREW:', e);
      // Continue anyway — state update is what matters for UX
    }

    console.log('[AUTH] calling setIsGuest(true)...');
    setIsGuest(true);
    console.log('[AUTH] setIsGuest(true) called');
  }, []);

  const exitGuestMode = useCallback(async () => {
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    setIsGuest(false);
  }, []);
  console.log('[AUTH] rendering provider | isGuest =', isGuest, '| loading =', loading);
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profileState,
        loading,
        isGuest,
        signIn,
        signUp,
        resendVerification,
        signOut,
        refreshProfileState,
        continueAsGuest,
        exitGuestMode,
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