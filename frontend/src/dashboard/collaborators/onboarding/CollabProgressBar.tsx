import { motion } from "motion/react";

interface Props { currentStep: number; totalSteps: number; }

export function CollabProgressBar({ currentStep, totalSteps }: Props) {
  const progress = (currentStep / totalSteps) * 100;
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Step {currentStep} of {totalSteps}</span>
        <span className="text-[10px] font-black text-[#58a6ff]">{Math.round(progress)}% Complete</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#0066ff] to-[#20c937]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
