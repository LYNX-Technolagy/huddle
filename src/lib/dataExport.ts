// src/lib/dataExport.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export interface ExportResult {
  /** Filename that was written (native) or would-be filename (web) */
  filename: string;
  /** Local file URI (native only) */
  uri: string | null;
  /** Raw JSON string — always available, used as web fallback */
  json: string;
}

/**
 * Fetch the current user's data export from the RPC.
 * Throws on auth failure or network error.
 */
export async function fetchMyData(): Promise<Record<string, unknown>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_my_data');

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Empty response from server');

  return data as Record<string, unknown>;
}

/**
 * Build a filename like: huddle-export-luvohoops-2026-09-29.json
 */
function buildFilename(username?: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeUser = (username ?? 'user').replace(/[^a-z0-9_-]/gi, '');
  return `huddle-export-${safeUser}-${date}.json`;
}

/**
 * Full export flow:
 *  1. Fetch data from RPC
 *  2. Serialize pretty JSON
 *  3. Native: write to app documents dir, return URI for sharing
 *     Web: skip file write (caller downloads via Blob)
 */
export async function generateExport(
  username?: string
): Promise<ExportResult> {
  const data = await fetchMyData();
  const json = JSON.stringify(data, null, 2);
  const filename = buildFilename(username);

  if (Platform.OS === 'web') {
    return { filename, uri: null, json };
  }

  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return { filename, uri, json };
}

/**
 * Share an exported file (native only).
 * On web, this is a no-op — the caller handles Blob download.
 */
export async function shareExport(result: ExportResult): Promise<void> {
  if (Platform.OS === 'web' || !result.uri) return;

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(result.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your Huddle data',
    UTI: 'public.json',
  });
}