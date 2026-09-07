import { useEffect, useState } from "react";
import { fetchSelectableModels, type SelectableModel } from "@/lib/api/models";

export function ModelSelector({ value, onChange, taskType }: { value: string; onChange: (value: string) => void; taskType?: string }) {
  const [models, setModels] = useState<SelectableModel[]>([]);
  useEffect(() => { void fetchSelectableModels(taskType).then(setModels).catch(() => setModels([])); }, [taskType]);
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">AI model</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all"
      >
        <option value="" className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white">Autonomous routing (recommended)</option>
        {models.map((model) => (
          <option key={model.id} value={model.id} disabled={!model.configured} className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white">
            {model.id} · {model.provider}{model.configured ? "" : " (not configured)"}
          </option>
        ))}
      </select>
      <span className="mt-1.5 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
        Your choice is honored only when it meets the task’s minimum quality and capability requirements.
      </span>
    </label>
  );
}
