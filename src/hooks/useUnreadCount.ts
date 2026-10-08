// src/hooks/useUnreadCount.ts
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getUnreadCount } from '../lib/notifications';

/**
 * Returns the current user's unread notification count.
 * Refreshes every time the screen comes into focus.
 */
export function useUnreadCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const c = await getUnreadCount();
      setCount(c);
    } catch {
      // Silent — badge failure isn't worth surfacing
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return count;
}