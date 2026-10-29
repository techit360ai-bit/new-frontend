import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, ShieldCheck } from 'lucide-react';
import { recordConsent } from '@/lib/api/compliance';

export function CookieConsent() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('techit_cookie_consent'));

  const choose = (granted: boolean) => {
    localStorage.setItem('techit_cookie_consent', granted ? 'accepted' : 'essential-only');
    setVisible(false);
    void recordConsent({ purpose: 'cookies', version: '2026-08-07', granted }).catch(() => undefined);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.18 } }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          role="region"
          aria-label="Storage and Cookie Consent"
          className="fixed inset-x-4 bottom-24 z-[100] mx-auto max-w-2xl lg:bottom-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F14]/95 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            {/* Subtle top accent */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent" />

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
              {/* Icon + content */}
              <div className="flex flex-1 items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#3B82F6]">
                  <Cookie className="h-5 w-5" strokeWidth={1.8} />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#3B82F6]">
                    <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                    <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em]">
                      Privacy
                    </span>
                  </div>
                  <p className="font-sans text-sm leading-relaxed text-slate-300">
                    TechIT uses essential storage for authentication and preferences. Optional cookies require your consent.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => choose(false)}
                  className="cursor-pointer rounded-lg border border-white/10 bg-transparent px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40 sm:text-sm"
                >
                  Essential only
                </button>

                <button
                  type="button"
                  onClick={() => choose(true)}
                  className="cursor-pointer rounded-lg bg-[#3B82F6] px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F14] sm:text-sm"
                >
                  Accept optional
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}