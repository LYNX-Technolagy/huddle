// src/lib/pwaInstall.ts
// Helpers for the PWA install flow on web.

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Module-level storage — survives across components
let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Call this once on app startup (web only).
 * Captures the browser's install prompt so we can trigger it later.
 */
export function initInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] beforeinstallprompt captured');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] app installed');
    deferredPrompt = null;
  });
}

/**
 * Returns true if the browser has a native install prompt ready to fire.
 */
export function hasNativeInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

/**
 * Fires the native install prompt. Returns the outcome or null if no prompt available.
 */
export async function triggerNativeInstall(): Promise<'accepted' | 'dismissed' | null> {
  if (!deferredPrompt) return null;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  // The prompt can only be used once
  deferredPrompt = null;

  return outcome;
}

/**
 * Detects if the app is running in standalone (installed) mode.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // iOS Safari
  if ((window.navigator as any).standalone === true) return true;

  // Standard PWA display mode
  if (window.matchMedia('(display-mode: standalone)').matches) return true;

  // Chrome on Android
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;

  return false;
}

/**
 * Detects the platform for showing the right install tutorial.
 */
export function getPlatform(): 'ios' | 'android' | 'desktop' | 'other' {
  if (typeof window === 'undefined') return 'other';

  const ua = window.navigator.userAgent;

  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh|Windows|Linux/.test(ua)) return 'desktop';

  return 'other';
}

/**
 * Reads the ?install=1 query param from the URL.
 */
export function shouldShowInstallFlow(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('install') === '1';
}

/**
 * Removes the ?install=1 query param from the URL without a page reload.
 */
export function clearInstallParam() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('install');
  window.history.replaceState({}, '', url.toString());
}