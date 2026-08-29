import { useEffect, useState } from "react";
import { fetchSelectableModels, type SelectableModel } from "@/lib/api/models";

export function ModelSelector({ value, onChange, taskType }: { value: string; onChange: (value: string) => void; taskType?: string }) {
  const [models, setModels] = useState<SelectableModel[]>([]);
  useEffect(() => { void fetchSelectableModels(taskType).then(setModels).catch(() => setModels([])); }, [taskType]);
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-600">AI model</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Autonomous routing (recommended)</option>{models.map((model) => <option key={model.id} value={model.id} disabled={!model.configured}>{model.id} · {model.provider}{model.configured ? "" : " (not configured)"}</option>)}</select><span className="mt-1 block text-[11px] text-slate-500">Your choice is honored only when it meets the task’s minimum quality and capability requirements.</span></label>;
}
