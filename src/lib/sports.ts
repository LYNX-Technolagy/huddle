// src/lib/sports.ts
import { supabase } from './supabase';
import type { SportRow } from '../types';

/**
 * List all sports. Cached implicitly by Supabase's CDN.
 */
export async function listSports(): Promise<SportRow[]> {
  const { data, error } = await supabase
    .from('sports')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as SportRow[];
}