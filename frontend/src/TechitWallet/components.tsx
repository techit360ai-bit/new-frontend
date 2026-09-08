import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ArrowDown, Clock3, Info, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { CreditPackage, WalletBucket, WalletRestriction, WalletTransaction } from '@/lib/api/wallet';

export function WalletCard({ wallet }: { wallet: WalletBucket }) {
  const expiry = wallet.expiresAt ? new Date(wallet.expiresAt).toLocaleDateString() : null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">{wallet.label}</CardTitle>
            <Badge className={wallet.status === 'active' ? 'border-[#20c937]/20 bg-[#20c937]/10 text-[#20c937] font-semibold' : 'border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400'}>
              {wallet.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{wallet.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold tracking-tight font-mono text-slate-900 dark:text-white">{wallet.balance.toLocaleString()}</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">credits</span>
          </div>
          <Progress value={wallet.usagePercent} aria-label={`${wallet.label} usage`} className="h-2 bg-black/[0.06] dark:bg-white/10" />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{wallet.usagePercent}% used</span>
            <span>{expiry ? `Expires ${expiry}` : 'No expiry'}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function WalletSummary({ wallets, deductionOrder }: { wallets: WalletBucket[]; deductionOrder: string[] }) {
  const labels = Object.fromEntries(wallets.map(wallet => [wallet.id, wallet.label]));
  return (
    <section aria-labelledby="deduction-order" className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff]">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h2 id="deduction-order" className="font-bold text-slate-900 dark:text-white">Credit deduction order</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The backend applies credits in this order. The frontend does not perform deductions.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
            {deductionOrder.map((id, index) => (
              <span key={id} className="flex items-center gap-2">
                <span className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] px-3 py-1 text-slate-800 dark:text-slate-200">
                  {labels[id] || id}
                </span>
                {index < deductionOrder.length - 1 && <ArrowDown className="h-4 w-4 text-slate-400 sm:rotate-[-90deg]" />}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function WalletAlert({ children, tone = 'warning' }: { children: React.ReactNode; tone?: 'warning' | 'info' }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${tone === 'warning' ? 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300' : 'border-[#0066ff]/20 bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff]'}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function UpgradeCard({ restriction, onUpgrade, onBuy }: { restriction?: WalletRestriction | null; onUpgrade: () => void; onBuy: () => void }) {
  return (
    <Card className="rounded-2xl border border-[#0066ff]/20 bg-[#0066ff]/10 dark:bg-[#0066ff]/15">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">Upgrade required</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{restriction?.reason || 'This operation is restricted by your current wallet or plan.'}</p>
          {restriction?.missingCapability && (
            <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">Missing capability: {restriction.missingCapability}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onUpgrade}
            className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
          >
            Upgrade
          </button>
          <button
            onClick={onBuy}
            className="rounded-xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.1] transition-all"
          >
            Buy credits
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WalletTransactionTable({ transactions, onSelect }: { transactions: WalletTransaction[]; onSelect: (transaction: WalletTransaction) => void }) {
  return (
    <Card className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white font-bold">Wallet transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Wallet used</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] dark:divide-white/10">
              {transactions.map(transaction => {
                const credits = Number(transaction.deltaCredits ?? transaction.credits ?? 0);
                return (
                  <tr
                    key={transaction.id}
                    tabIndex={0}
                    onClick={() => onSelect(transaction)}
                    onKeyDown={event => { if (event.key === 'Enter') onSelect(transaction); }}
                    className="cursor-pointer outline-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500 dark:text-slate-400">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="max-w-[260px] truncate px-4 py-3.5 font-medium text-slate-900 dark:text-white">{transaction.title || transaction.description || 'Wallet activity'}</td>
                    <td className={`whitespace-nowrap px-4 py-3.5 font-mono font-bold ${credits >= 0 ? 'text-[#20c937]' : 'text-rose-500'}`}>{credits >= 0 ? '+' : ''}{credits.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{transaction.walletUsed || transaction.walletType || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge className="border-black/[0.08] dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-semibold">{transaction.status || 'recorded'}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function WalletTransactionDrawer({ transaction, onClose }: { transaction: WalletTransaction | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {transaction && (
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#121212] p-6 shadow-2xl overflow-y-auto text-slate-900 dark:text-white">
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/10 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transaction details</h2>
            <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close transaction details" className="rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <dl className="mt-6 space-y-4 text-sm">
            {Object.entries(transaction).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 border-b border-black/[0.04] dark:border-white/5 pb-3">
                <dt className="text-slate-500 dark:text-slate-400 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                <dd className="max-w-[220px] break-words text-right font-medium text-slate-900 dark:text-white">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CreditPackCard({ pack, onSelect }: { pack: CreditPackage; onSelect: (pack: CreditPackage) => void }) {
  return (
    <Card className="relative h-full rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-sm flex flex-col">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{pack.name}</h3>
          {pack.popular && <Badge className="bg-[#0066ff] text-white font-bold">Popular</Badge>}
        </div>
        <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{pack.credits.toLocaleString()} <span className="text-sm font-medium text-slate-500 dark:text-slate-400 font-sans">credits</span></p>
        {pack.bonusCredits ? (
          <p className="text-sm font-semibold text-[#20c937]">+{pack.bonusCredits.toLocaleString()} bonus credits</p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Backend-priced pack</p>
        )}
        <p className="text-xl font-bold text-slate-900 dark:text-white">{pack.price || 'Price available at checkout'}</p>
        <button
          className="mt-auto w-full rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] py-2.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
          onClick={() => onSelect(pack)}
        >
          Continue to payment
        </button>
      </CardContent>
    </Card>
  );
}

export function WalletSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="space-y-4 p-5 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-full" />
        </Card>
      ))}
    </div>
  );
}

export function EmptyWalletState({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/[0.1] dark:border-white/10 p-10 text-center bg-white/50 dark:bg-[#121212]/50">
      <Clock3 className="mx-auto h-8 w-8 text-slate-400" />
      <h2 className="mt-3 font-bold text-slate-900 dark:text-white text-lg">No wallet activity yet.</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start using TechIT to see credits and transactions here.</p>
      <button
        className="mt-4 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
        onClick={onStart}
      >
        Start using TechIT
      </button>
    </div>
  );
}
