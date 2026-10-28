import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  DollarSign,
  Scale,
  Handshake,
  Send,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { useOrgProfile } from "@/contexts/UserContext";
import { createOrganizerHackathon } from "@/lib/api/hackathon";

const judgingDimensions = [
  { id: "problem_clarity", label: "Problem Clarity" },
  { id: "solution_innovation", label: "Solution Innovation" },
  { id: "technical_execution", label: "Technical Execution" },
  { id: "team_communication", label: "Team Communication" },
  { id: "commercial_viability", label: "Commercial Viability" },
];

const defaultPrizes = [{ rank: "1st place", amount: "" }];

function prizePoolLabel(prizes: Array<{ amount: string }>): string {
  const amounts = prizes.map((prize) => prize.amount.trim()).filter(Boolean);
  if (amounts.length === 0) return "";
  const numeric = amounts.map((amount) => Number(amount.replace(/[^0-9.]/g, "")));
  if (numeric.every((amount) => Number.isFinite(amount) && amount > 0)) {
    return `$${numeric.reduce((sum, amount) => sum + amount, 0).toLocaleString()}`;
  }
  return amounts.join(", ");
}

export function HackathonCreate() {
  const navigate = useNavigate();
  const { orgProfile } = useOrgProfile();

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(48);
  const [eligibility, setEligibility] = useState("");
  const [prizes, setPrizes] = useState(defaultPrizes);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(
    judgingDimensions.map((d) => d.id),
  );
  const [partners, setPartners] = useState<string[]>([]);
  const [partnerInput, setPartnerInput] = useState("");
  const [mentorPool, setMentorPool] = useState(0);
  const [publishing, setPublishing] = useState(false);

  const toggleDimension = (id: string) =>
    setSelectedDimensions((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );

  const addPartner = () => {
    const v = partnerInput.trim();
    if (v && !partners.includes(v)) {
      setPartners([...partners, v]);
      setPartnerInput("");
    }
  };

  const removePartner = (p: string) =>
    setPartners(partners.filter((x) => x !== p));

  const updatePrize = (idx: number, field: "rank" | "amount", value: string) =>
    setPrizes((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );

  const addPrizeTier = () =>
    setPrizes([...prizes, { rank: `${prizes.length + 1}th place`, amount: "" }]);

  const removePrizeTier = (idx: number) =>
    setPrizes(prizes.filter((_, i) => i !== idx));

  const canPublish =
    title.trim() &&
    theme.trim() &&
    startDate &&
    endDate &&
    selectedDimensions.length >= 3;

  const handlePublish = async () => {
    if (!canPublish || publishing) return;
    setPublishing(true);
    try {
      const hackathon = await createOrganizerHackathon({
        title: title.trim(),
        theme: theme.trim(),
        summary: theme.trim(),
        visibility: "public",
        status: "upcoming",
        hackathonStatus: "upcoming",
        applyDeadline: startDate,
        startDate,
        endDate,
        durationHours: duration,
        prizePool: prizePoolLabel(prizes),
        eligibility: eligibility.trim(),
        prizes: prizes
          .map((prize) => ({ rank: prize.rank.trim(), amount: prize.amount.trim() }))
          .filter((prize) => prize.rank || prize.amount),
        judgingDimensions: selectedDimensions,
        partners,
        mentorPool,
        organizerName: orgProfile.orgName,
      });
      if (!hackathon) {
        toast.error("The hackathon was not persisted.");
        return;
      }
      toast.success("Hackathon published");
      navigate(`/org/hackathons/${hackathon.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hackathon publishing failed.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 transition-colors">
      <Link
        to="/org/hackathons"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#20C997] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to hackathons
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <span className="bg-[#20C997]/10 border border-[#20C997]/20 p-2 rounded-xl">
            <Trophy className="w-7 h-7 text-[#20C997]" />
          </span>
          Create new hackathon
        </h1>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
          Stage 1 — set the theme, judging framework and partners. The event will
          be published to the Opportunities Board.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme */}
        <Section icon={Sparkles} title="Theme & basics">
          <Field label="Event title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI for Africa 2026"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997] outline-none text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </Field>
          <Field label="Theme / problem statement">
            <textarea
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              rows={3}
              placeholder="One paragraph describing what you want teams to build."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997] outline-none text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none"
            />
          </Field>
          <Field label="Eligibility">
            <input
              type="text"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997] outline-none text-xs font-medium text-slate-900 dark:text-white"
            />
          </Field>
        </Section>

        {/* Dates */}
        <Section icon={Calendar} title="Dates & duration">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Start date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] outline-none text-xs font-bold text-slate-900 dark:text-white"
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] outline-none text-xs font-bold text-slate-900 dark:text-white"
              />
            </Field>
            <Field label="Build window (hours)">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                min={6}
                max={336}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] outline-none text-xs font-bold text-slate-900 dark:text-white"
              />
            </Field>
          </div>
        </Section>

        {/* Prizes */}
        <Section icon={DollarSign} title="Prize structure">
          <div className="space-y-3">
            {prizes.map((p, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={p.rank}
                  onChange={(e) => updatePrize(idx, "rank", e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] outline-none text-xs font-medium text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={p.amount}
                  placeholder="$10,000"
                  onChange={(e) => updatePrize(idx, "amount", e.target.value)}
                  className="w-40 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] outline-none text-xs font-medium text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => removePrizeTier(idx)}
                  disabled={prizes.length <= 1}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Remove tier"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addPrizeTier}
              className="text-xs text-[#20C997] hover:underline font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add prize tier
            </button>
          </div>
        </Section>

        {/* Judging */}
        <Section icon={Scale} title="Judging framework">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Each enabled dimension is scored 1–10 by judges. These combine with
            three platform-computed metrics (Problem Clarity Score, Team Momentum
            Score, Prototype Demo Readiness time) into a composite Hackathon
            Score per team.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {judgingDimensions.map((d) => {
              const active = selectedDimensions.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDimension(d.id)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    active
                      ? "border-[#20C997] bg-[#20C997]/10 text-slate-900 dark:text-white"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:border-[#20C997]/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{d.label}</span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider ${active ? "text-[#20C997]" : "text-slate-400 dark:text-slate-500"}`}
                    >
                      {active ? "On" : "Off"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedDimensions.length < 3 && (
            <p className="text-xs text-amber-500 font-bold mt-3">
              Pick at least 3 dimensions for a meaningful composite score.
            </p>
          )}
        </Section>

        {/* Partners */}
        <Section icon={Handshake} title="Partner organisations">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={partnerInput}
              onChange={(e) => setPartnerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPartner()}
              placeholder="Add a partner or sponsor name"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] outline-none text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button
              onClick={addPartner}
              className="px-4 py-2.5 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-slate-950 text-xs font-bold transition-all"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {partners.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#20C997]/10 text-[#20C997] text-xs font-bold border border-[#20C997]/20"
              >
                {p}
                <button
                  onClick={() => removePartner(p)}
                  className="text-[#20C997]/60 hover:text-[#20C997]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <Field label="Mentor pool size">
            <input
              type="number"
              value={mentorPool}
              onChange={(e) => setMentorPool(parseInt(e.target.value) || 0)}
              min={0}
              className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:border-[#20C997] outline-none text-xs font-bold text-slate-900 dark:text-white"
            />
          </Field>
        </Section>

        {/* Publish row */}
        <div className="flex items-center justify-between bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
            On publish, the event will be routed to matching builders on the
            Opportunities Board.
          </div>
          <button
            onClick={() => void handlePublish()}
            disabled={!canPublish || publishing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#20C997] hover:bg-[#1db587] disabled:bg-slate-100 dark:disabled:bg-white/10 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
            {publishing ? "Publishing..." : "Publish hackathon"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Trophy;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-[#20C997]" />
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
