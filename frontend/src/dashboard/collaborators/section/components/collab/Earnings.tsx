// frontend/src/dashboard/collaborators/section/components/collab/Earnings.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DollarSign, ArrowUpRight, Wallet, History, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { EMPTY_EARNINGS, fetchCollaboratorEarnings, requestWithdrawal } from "@/lib/api/earnings";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export function Earnings() {
  const [earnings, setEarnings] = useState(EMPTY_EARNINGS.cashEarnings);
  const [totals, setTotals]     = useState(EMPTY_EARNINGS.totals);
  const [payoutList, setPayoutList] = useState(EMPTY_EARNINGS.payouts);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState<number>(totals.pendingUSD);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCollaboratorEarnings()
      .then((data) => {
        if (!alive) return;
        setEarnings(data.cashEarnings);
        setPayoutList(data.payouts);
        setTotals(data.totals);
        setAmount(data.totals.pendingUSD);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setEarnings(EMPTY_EARNINGS.cashEarnings);
        setPayoutList(EMPTY_EARNINGS.payouts);
        setTotals(EMPTY_EARNINGS.totals);
        setAmount(0);
        setError(err instanceof Error ? err.message : "Live earnings records are unavailable.");
      });
    return () => { alive = false; };
  }, []);

  const handleWithdraw = async () => {
    if (amount <= 0 || amount > totals.pendingUSD) return;
    const month = new Date().toISOString().slice(0, 7);
    let res;
    try {
      res = await requestWithdrawal({ amount, monthIso: month, idemKey: `p-${Date.now()}` });
    } catch (err) {
      toast(`Withdrawal failed — ${err instanceof Error ? err.message : "backend unavailable"}.`);
      return;
    }
    if (!res.ok) {
      toast(`Withdrawal failed${res.available != null ? ` — up to $${res.available.toLocaleString()} available` : ""}.`);
      return;
    }
    const payout = res.payout ?? { id: `p-${Date.now()}`, monthIso: month, amount, status: "processing" as const };
    setPayoutList((cur) => [payout, ...cur]);
    setTotals((cur) => ({ ...cur, pendingUSD: res.newPendingUSD ?? cur.pendingUSD - amount }));
    toast(`Withdrawal initiated — $${amount.toLocaleString()} to ${res.destination ?? "•••1234"}. Funds arrive in 1–3 business days.`);
    setWithdrawOpen(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Earnings & Payouts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Cash compensation and revenue share across active and historical builds.</p>
        </div>
        <button
          onClick={() => { setAmount(totals.pendingUSD); setWithdrawOpen(true); }}
          disabled={totals.pendingUSD <= 0}
          className="h-10 px-4 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white rounded-xl text-xs font-bold shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <Wallet className="w-4 h-4" />
          <span>Withdraw Funds</span>
        </button>
      </div>

      {error && (
        <div className="border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-2xl px-5 py-3.5 text-sm backdrop-blur-md">
          Live earnings records could not be loaded: {error}
        </div>
      )}

      {/* Three stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Lifetime" value={`$${(totals.lifetimeUSD / 1000).toFixed(0)}K`} sub="Total cash earned" />
        <Stat label="Pending" value={`$${totals.pendingUSD.toLocaleString()}`} sub="Awaiting payout clearance" />
        <Stat label="Revenue Share (TTM)" value={`$${totals.revenueShareTTMUsd.toLocaleString()}`} sub="Trailing 12 months" />
      </div>

      {/* Per-startup breakdown */}
      <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/10 flex items-center gap-2 bg-slate-50/40 dark:bg-white/[0.02]">
          <Building2 className="w-4 h-4 text-[#0066ff] dark:text-[#58a6ff]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Per-Startup Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-black/[0.06] dark:border-white/10">
                <th className="text-left px-6 py-3.5 font-bold">Project</th>
                <th className="text-right px-6 py-3.5 font-bold">Earned</th>
                <th className="text-right px-6 py-3.5 font-bold">Pending</th>
                <th className="text-right px-6 py-3.5 font-bold">Rev Share</th>
                <th className="text-left px-6 py-3.5 font-bold">Contribution Note</th>
                <th className="px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {earnings.length > 0 ? earnings.map((c) => (
                <tr key={c.projectId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{c.projectName}</td>
                  <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900 dark:text-white">${c.earned.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-amber-600 dark:text-amber-400 font-semibold">${c.pending.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-[#0066ff] dark:text-[#58a6ff] font-bold">{c.revenueSharePercent}%</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{c.contributionNote}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/collaborator/equity#startup-${c.projectId}`}
                      className="text-xs px-3 py-1.5 rounded-xl bg-[#0066ff]/10 hover:bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff] font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Equity</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">
                    No cash earnings have been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout history chart */}
      <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-[#0066ff] dark:text-[#58a6ff]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Payout History</h2>
        </div>

        {payoutList.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 italic">No payout history has been recorded yet.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...payoutList].reverse()}>
                <XAxis dataKey="monthIso" tick={{ fontSize: 11, fill: "#888888" }} stroke="#88888820" tickFormatter={(m) => String(m).slice(2)} />
                <YAxis tick={{ fontSize: 11, fill: "#888888" }} stroke="#88888820" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v: number) => `$${v.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "rgba(18, 18, 18, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {payoutList.map((p) => (
                    <Cell key={p.id} fill={p.status === "processing" ? "#f59e0b" : "#0066ff"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {payoutList.length > 0 && (
          <ul className="mt-6 divide-y divide-black/[0.04] dark:divide-white/[0.06] border-t border-black/[0.06] dark:border-white/10">
            {payoutList.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{p.monthIso}</span>
                <span className="flex items-center gap-3">
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                    p.status === "processing"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  }`}>
                    {p.status}
                  </span>
                  <span className="font-extrabold tabular-nums text-slate-900 dark:text-white">${p.amount.toLocaleString()}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Withdraw dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Withdraw Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Destination Bank Account</label>
              <div className="p-3.5 border border-[#0066ff]/30 bg-[#0066ff]/5 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Wells Fargo · Checking</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Account ending in •••1234</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-[#20c937]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Amount (USD)</label>
              <input
                type="number"
                min={0}
                max={totals.pendingUSD}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs tabular-nums bg-slate-50 dark:bg-white/[0.05] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Available balance: ${totals.pendingUSD.toLocaleString()}</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <button
              onClick={() => setWithdrawOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={amount <= 0 || amount > totals.pendingUSD}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] disabled:opacity-50 transition-all"
            >
              Confirm Withdrawal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">{label}</p>
      <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums mt-1">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{sub}</p>
    </div>
  );
}
