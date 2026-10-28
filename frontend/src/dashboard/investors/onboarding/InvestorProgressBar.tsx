interface InvestorProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function InvestorProgressBar({
  currentStep,
  totalSteps,
}: InvestorProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-semibold text-[#20C997]">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#20C997] to-[#1ba87e] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
