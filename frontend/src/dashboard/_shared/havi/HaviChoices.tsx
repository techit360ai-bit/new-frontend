import { useState } from "react";
import { Target, User, Clock, Check } from "lucide-react";
import { motion } from "motion/react";
import { personalityModes, type PersonalityMode } from "./haviData";
import type { MvpPlan } from "./mvpEstimate";

interface HaviChoicesProps {
  plan: MvpPlan;
  personality: PersonalityMode;
  onPersonalityChange: (m: PersonalityMode) => void;
  onTargetDateChange: (date: string) => void;
}

export function HaviChoices({
  plan,
  personality,
  onPersonalityChange,
  onTargetDateChange,
}: HaviChoicesProps) {
  const [dateDraft, setDateDraft] = useState(plan.targetDate);
  const [saved, setSaved] = useState(false);

  const saveDate = () => {
    onTargetDateChange(dateDraft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Edit the choices you made earlier — Havi adapts to whatever you set here.
      </p>

      {/* MVP target date */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-[#20C997]" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Your MVP target date</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-normal">
          {plan.userSet
            ? "You set this date. Change it any time."
            : "Estimated from your stage. Set your own to make it personal."}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateDraft}
            onChange={(e) => setDateDraft(e.target.value)}
            className="flex-1 px-3.5 py-2.5 border border-black/[0.08] dark:border-white/10 rounded-xl bg-white dark:bg-[#111111] text-slate-900 dark:text-white text-sm outline-none focus:border-[#20C997] focus:ring-2 focus:ring-[#20C997]/20 transition-all font-normal"
          />
          <button
            onClick={saveDate}
            className="px-4 py-2.5 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-slate-950 text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Personality mode */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-[#20C997]" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">How Havi talks to you</h3>
        </div>
        <div className="grid gap-2.5">
          {(Object.keys(personalityModes) as PersonalityMode[]).map((mode) => {
            const info = personalityModes[mode];
            const isSelected = personality === mode;
            return (
              <motion.button
                key={mode}
                onClick={() => onPersonalityChange(mode)}
                whileTap={{ scale: 0.98 }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-[#20C997] bg-[#20C997]/10 dark:bg-[#20C997]/20 shadow-sm"
                    : "border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/80 hover:border-[#20C997]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-bold ${isSelected ? "text-[#20C997]" : "text-slate-900 dark:text-white"}`}>
                    <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${info.colorClass}`} aria-hidden="true" />
                    {info.name}
                  </h4>
                  {isSelected && <Check className="w-4 h-4 text-[#20C997]" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal leading-relaxed">{info.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Working hours */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-[#20C997]" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">When Havi nudges you</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Start</label>
            <input
              type="time"
              defaultValue="09:00"
              className="w-full px-3.5 py-2.5 border border-black/[0.08] dark:border-white/10 rounded-xl bg-white dark:bg-[#111111] text-slate-900 dark:text-white text-sm outline-none focus:border-[#20C997] focus:ring-2 focus:ring-[#20C997]/20 transition-all font-normal"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">End</label>
            <input
              type="time"
              defaultValue="17:00"
              className="w-full px-3.5 py-2.5 border border-black/[0.08] dark:border-white/10 rounded-xl bg-white dark:bg-[#111111] text-slate-900 dark:text-white text-sm outline-none focus:border-[#20C997] focus:ring-2 focus:ring-[#20C997]/20 transition-all font-normal"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-normal">Havi only sends reminders during these hours.</p>
      </div>
    </div>
  );
}
