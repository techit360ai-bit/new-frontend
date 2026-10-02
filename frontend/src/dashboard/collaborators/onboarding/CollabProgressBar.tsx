interface Props { currentStep: number; totalSteps: number; }

export function CollabProgressBar({ currentStep, totalSteps }: Props) {
  const progress = (currentStep / totalSteps) * 100;
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-text-muted">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm text-status-warning font-semibold">{Math.round(progress)}% Complete</span>
      </div>
      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-status-warning transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
