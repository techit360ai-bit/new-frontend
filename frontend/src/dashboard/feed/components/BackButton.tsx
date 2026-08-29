import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Returns to an explicit in-app fallback instead of browser history so shared
 * feed pages cannot jump across role dashboards.
 */
export function BackButton({
  label = 'Back',
  fallback = '/feed',
  className = '',
}: {
  label?: string;
  fallback?: string;
  className?: string;
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(fallback);
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
