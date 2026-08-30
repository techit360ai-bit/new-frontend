import { useState } from 'react';
import { recordConsent } from '@/lib/api/compliance';

export function CookieConsent() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('techit_cookie_consent'));
  if (!visible) return null;
  const choose = (granted: boolean) => {
    localStorage.setItem('techit_cookie_consent', granted ? 'accepted' : 'essential-only');
    setVisible(false);
    void recordConsent({ purpose: 'cookies', version: '2026-08-07', granted }).catch(() => undefined);
  };
  return <div className="fixed inset-x-4 bottom-20 z-[100] mx-auto max-w-3xl rounded-lg border border-border-strong bg-surface-primary p-4 shadow-xl dark:border-border-inverse-strong dark:bg-background-inverse lg:bottom-4">
    <p className="text-sm text-text-secondary dark:text-text-on-inverse-secondary">TechIT uses essential storage for authentication and preferences. Optional cookies require your consent.</p>
    <div className="mt-3 flex justify-end gap-2">
      <button onClick={() => choose(false)} className="rounded-md border px-3 py-2 text-sm">Essential only</button>
      <button onClick={() => choose(true)} className="rounded-md bg-violet-600 px-3 py-2 text-sm text-white">Accept optional</button>
    </div>
  </div>;
}
