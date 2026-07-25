import { Bot } from "lucide-react";
import type { HaviRole } from "./haviData";

export function HaviChat({ role }: { role: HaviRole }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100">
        <Bot className="h-6 w-6 text-cyan-700" />
      </div>
      <h3 className="font-semibold text-slate-900">Live Havi chat is unavailable</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        {role === "founder" ? "Founder" : "Collaborator"} guidance appears in the Today tab when the persisted tour-guide service returns it. This screen will not generate scripted answers.
      </p>
    </div>
  );
}
