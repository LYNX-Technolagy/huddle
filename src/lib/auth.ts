// src/lib/auth.ts
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface SignUpParams {
  email: string;
  password: string;
  username: string;
  fullName?: string;
}

export interface AuthResult {
  data: { user: User | null; session: Session | null };
  error: Error | null;
}

/**
 * Sign up a new user.
 * Username + full name are passed via options.data so the
 * handle_new_user trigger can read them from raw_user_meta_data.
 */
export async function signUp(params: SignUpParams): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        username: params.username,
        full_name: params.fullName ?? null,
      },
    },
  });

  return {
    data: { user: data.user ?? null, session: data.session ?? null },
    error: error ? new Error(error.message) : null,
  };
}

export interface SignInParams {
  email: string;
  password: string;
}

export async function signIn(params: SignInParams): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  return {
    data: { user: data.user ?? null, session: data.session ?? null },
    error: error ? new Error(error.message) : null,
  };
}

/**
 * Sign in with Google.
 * On native, pass the OAuth URL back through your deep link scheme.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'huddle://auth-callback',
      skipBrowserRedirect: true, // native: handle URL manually
    },
  });

  // NOTE: on native you'll need to open the returned `data.url` in a
  // WebBrowser (expo-web-browser) and parse the redirect.
  // Full implementation comes in the auth-context step.
  return {
    data: { user: null, session: null },
    error: error ? new Error(error.message) : null,
  };
}

export async function signOut(): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error ? new Error(error.message) : null };
}

/**
 * Verify an email confirmation token (6-digit code).
 * Supabase sends this by default when "Confirm email" is enabled.
 */
export async function verifyEmailCode(
  email: string,
  token: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });

  return {
    data: { user: data.user ?? null, session: data.session ?? null },
    error: error ? new Error(error.message) : null,
  };
}

export async function resendVerification(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(
  callback: (session: Session | null) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}