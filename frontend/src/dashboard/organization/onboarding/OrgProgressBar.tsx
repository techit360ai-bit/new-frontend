interface OrgProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function OrgProgressBar({
  currentStep,
  totalSteps,
}: OrgProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-text-muted dark:text-text-disabled">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-brand-accent dark:text-brand-accent font-semibold">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <div className="w-full h-1 bg-slate-200 dark:bg-surface-inverse-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-accent to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
