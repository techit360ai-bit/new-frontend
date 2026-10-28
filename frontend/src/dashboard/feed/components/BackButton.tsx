import { ArrowLeft } from 'lucide-react';
import { useRouteTracker } from '@/contexts/RouteTrackerContext';

/**
 * Route-tracking BackButton that navigates back to the user's actual previous route
 * tracked across the session, with an optional fallback.
 */
export function BackButton({
  label = 'Back',
  fallback = '/feed',
  className = '',
  children,
}: {
  label?: string;
  fallback?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { goBack, previousRoute } = useRouteTracker();

  return (
    <button
      type="button"
      onClick={() => goBack(fallback)}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shadow-sm ${className}`}
      title={previousRoute ? `Back to ${previousRoute}` : label}
    >
      {children || (
        <>
          <ArrowLeft className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
