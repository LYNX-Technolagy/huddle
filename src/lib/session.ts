// src/lib/session.ts
import { supabase } from './supabase';

export async function consumeSessionFromUrl() {
  if (typeof window === 'undefined') return;

  // Supabase appends tokens to the hash fragment: #access_token=...&refresh_token=...
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) return;

  const params = new URLSearchParams(hash.substring(1));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (!error) {
      // Clean the URL so the tokens aren't sitting in the address bar
      window.history.replaceState(null, '', window.location.pathname);
      console.log('Session restored from email verification link.');
    } else {
      console.error('Failed to restore session:', error.message);
    }
  }
}