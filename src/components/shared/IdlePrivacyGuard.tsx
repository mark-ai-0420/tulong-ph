'use client';

import { useEffect } from 'react';
import { clearAllUserData } from '@/lib/storage';

export function IdlePrivacyGuard() {
  useEffect(() => {
    const idleLimit = 15 * 60 * 1000;
    const activityKey = 'tulongph-last-activity';
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel('tulongph-activity') : null;
    let lastActivity = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const receiveActivity = (value: unknown) => {
      if (typeof value === 'number' && Number.isFinite(value) && value <= Date.now()) {
        lastActivity = Math.max(lastActivity, value);
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      try { receiveActivity(Number(localStorage.getItem(activityKey))); } catch { /* BroadcastChannel still shares activity. */ }
      timer = setTimeout(() => {
        try { receiveActivity(Number(localStorage.getItem(activityKey))); } catch { /* Use the most recent broadcast. */ }
        if (Date.now() - lastActivity < idleLimit) { schedule(); return; }
        void clearAllUserData().catch(() => window.alert('Hindi nabura ang lahat ng datos. Burahin ang site data sa browser bago umalis.'));
      }, Math.max(1, idleLimit - (Date.now() - lastActivity)));
    };
    const reset = () => {
      lastActivity = Date.now();
      try { localStorage.setItem(activityKey, String(lastActivity)); } catch { /* No applicant data is broadcast. */ }
      channel?.postMessage(lastActivity);
      schedule();
    };
    const sharedActivity = (event: StorageEvent) => {
      if (event.key === activityKey) { receiveActivity(Number(event.newValue)); schedule(); }
    };
    if (channel) channel.onmessage = event => { receiveActivity(event.data); schedule(); };
    const events = ['pointerdown', 'keydown', 'input', 'scroll'];
    events.forEach(event => window.addEventListener(event, reset, { passive: true }));
    window.addEventListener('storage', sharedActivity);
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, reset));
      window.removeEventListener('storage', sharedActivity);
      channel?.close();
    };
  }, []);

  return null;
}
