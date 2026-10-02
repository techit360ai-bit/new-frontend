import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ArrowDown, Clock3, Info, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { CreditPackage, SubscriptionUsage, WalletAnalytics, WalletBucket, WalletRestriction, WalletTransaction } from '@/lib/api/wallet';
import type { TvceFreeUsage } from '@/lib/api/tvce';

export function WalletCard({ wallet }: { wallet: WalletBucket }) {
  const expiry = wallet.expiresAt ? new Date(wallet.expiresAt).toLocaleDateString() : null;
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="h-full bg-card/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3"><div className="flex items-center justify-between gap-2"><CardTitle className="text-base">{wallet.label}</CardTitle><Badge variant={wallet.status === 'active' ? 'secondary' : 'outline'}>{wallet.status}</Badge></div><p className="text-sm text-muted-foreground">{wallet.description}</p></CardHeader>
      <CardContent className="space-y-4"><div className="flex items-end justify-between"><span className="text-3xl font-semibold tracking-tight">{wallet.balance.toLocaleString()}</span><span className="text-sm text-muted-foreground">credits</span></div><Progress value={wallet.usagePercent} aria-label={`${wallet.label} usage`} /><div className="flex justify-between text-xs text-muted-foreground"><span>{wallet.usagePercent}% used</span><span>{expiry ? `Expires ${expiry}` : 'No expiry'}</span></div></CardContent>
    </Card>
  </motion.div>;
}

export function WalletSummary({ wallets, deductionOrder }: { wallets: WalletBucket[]; deductionOrder: string[] }) {
  const labels = Object.fromEntries(wallets.map(wallet => [wallet.id, wallet.label]));
  return <section aria-labelledby="deduction-order" className="rounded-xl border bg-muted/30 p-4"><div className="flex items-start gap-3"><Info className="mt-0.5 h-5 w-5 text-primary" /><div><h2 id="deduction-order" className="font-medium">Funding sources applied</h2><p className="mt-1 text-sm text-muted-foreground">Reported from completed usage, most-used first. The metering service records which funding source paid for each run; the frontend never performs deductions.</p><div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium">{deductionOrder.map((id, index) => <span key={id} className="flex items-center gap-2"><span className="rounded-md bg-background px-2 py-1">{labels[id] || id}</span>{index < deductionOrder.length - 1 && <ArrowDown className="h-4 w-4 text-muted-foreground sm:rotate-[-90deg]" />}</span>)}</div></div></div></section>;
}

export function WalletAlert({ children, tone = 'warning' }: { children: React.ReactNode; tone?: 'warning' | 'info' }) { return <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${tone === 'warning' ? 'border-status-warning/60 bg-status-warning-soft text-amber-950 dark:bg-amber-950/20 dark:text-amber-100' : 'border-primary/30 bg-primary/5'}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div>{children}</div></div>; }

export function UpgradeCard({ restriction, onUpgrade, onBuy }: { restriction?: WalletRestriction | null; onUpgrade: () => void; onBuy: () => void }) { return <Card className="border-primary/30 bg-primary/5"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Upgrade required</h2><p className="mt-1 text-sm text-muted-foreground">{restriction?.reason || 'This operation is restricted by your current wallet or plan.'}</p>{restriction?.missingCapability && <p className="mt-2 text-xs text-muted-foreground">Missing capability: {restriction.missingCapability}</p>}</div><div className="flex gap-2"><Button onClick={onUpgrade}>Upgrade</Button><Button variant="outline" onClick={onBuy}>Buy credits</Button></div></CardContent></Card>; }

export function WalletTransactionTable({ transactions, onSelect }: { transactions: WalletTransaction[]; onSelect: (transaction: WalletTransaction) => void }) { return <Card><CardHeader><CardTitle>Wallet transactions</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Credits</th><th className="px-4 py-3">Wallet used</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y">{transactions.map(transaction => { const credits = Number(transaction.deltaCredits ?? transaction.credits ?? 0); return <tr key={transaction.id} tabIndex={0} onClick={() => onSelect(transaction)} onKeyDown={event => { if (event.key === 'Enter') onSelect(transaction); }} className="cursor-pointer outline-none hover:bg-muted/30 focus:bg-muted/30"><td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : '—'}</td><td className="max-w-[260px] truncate px-4 py-3">{transaction.title || transaction.description || 'Wallet activity'}</td><td className={`whitespace-nowrap px-4 py-3 font-medium ${credits >= 0 ? 'text-status-success' : 'text-rose-600'}`}>{credits >= 0 ? '+' : ''}{credits.toLocaleString()}</td><td className="px-4 py-3 text-muted-foreground">{transaction.walletUsed || transaction.walletType || '—'}</td><td className="px-4 py-3"><Badge variant="outline">{transaction.status || 'recorded'}</Badge></td></tr>; })}</tbody></table></div></CardContent></Card>; }

export function WalletTransactionDrawer({ transaction, onClose }: { transaction: WalletTransaction | null; onClose: () => void }) { return <AnimatePresence>{transaction && <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l bg-background p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Transaction details</h2><Button size="icon" variant="ghost" onClick={onClose} aria-label="Close transaction details"><X className="h-4 w-4" /></Button></div><dl className="mt-6 space-y-4 text-sm">{Object.entries(transaction).map(([key, value]) => <div key={key} className="flex justify-between gap-4 border-b pb-3"><dt className="text-muted-foreground">{key}</dt><dd className="max-w-[220px] break-words text-right">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</dd></div>)}</dl></motion.div>}</AnimatePresence>; }

export function CreditPackCard({ pack, onSelect }: { pack: CreditPackage; onSelect: (pack: CreditPackage) => void }) { return <Card className="relative h-full"><CardContent className="flex h-full flex-col gap-4 p-5"><div className="flex items-center justify-between"><h3 className="font-semibold">{pack.name}</h3>{pack.popular && <Badge>Popular</Badge>}</div><p className="text-3xl font-bold">{pack.credits.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">credits</span></p>{pack.bonusCredits ? <p className="text-sm text-status-success">+{pack.bonusCredits.toLocaleString()} bonus credits</p> : <p className="text-sm text-muted-foreground">Backend-priced pack</p>}<p className="text-lg font-medium">{pack.price || 'Price available at checkout'}</p><Button className="mt-auto" onClick={() => onSelect(pack)}>Continue to payment</Button></CardContent></Card>; }

export function WalletSkeleton() { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Card key={index} className="space-y-4 p-5"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-10 w-1/2" /><Skeleton className="h-2 w-full" /><Skeleton className="h-4 w-full" /></Card>)}</div>; }
export function EmptyWalletState({ onStart }: { onStart: () => void }) { return <div className="rounded-xl border border-dashed p-10 text-center"><Clock3 className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No wallet activity yet.</h2><p className="mt-1 text-sm text-muted-foreground">Start using TechIT to see credits and transactions here.</p><Button className="mt-4" onClick={onStart}>Start using TechIT</Button></div>; }

export function InfoCard({ title, detail }: { title: string; detail: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{detail}</p></CardContent></Card>;
}

export function SubscriptionUsageCard({ usage }: { usage?: SubscriptionUsage | null }) {
  if (!usage) return <InfoCard title="Subscription usage" detail="No active subscription. Subscribe to a plan to see included, consumed, and remaining credits." />;
  const included = Number(usage.included ?? 0);
  const consumed = Number(usage.consumed ?? 0);
  const remaining = Number(usage.remaining ?? Math.max(0, included - consumed));
  const percent = included > 0 ? Math.min(100, Math.round((consumed / included) * 100)) : 0;
  return <Card><CardHeader><CardTitle>Subscription usage</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-end justify-between"><span className="text-3xl font-semibold tracking-tight">{remaining.toLocaleString()}</span><span className="text-sm text-muted-foreground">credits remaining</span></div><Progress value={percent} aria-label="Subscription usage" /><div className="flex justify-between text-xs text-muted-foreground"><span>{consumed.toLocaleString()} used of {included.toLocaleString()}</span><span>{usage.renewalAt ? `Renews ${new Date(usage.renewalAt).toLocaleDateString()}` : 'No renewal date'}</span></div></CardContent></Card>;
}

export function WalletAnalyticsCard({ analytics, error }: { analytics: WalletAnalytics | null; error?: boolean }) {
  if (error) return <InfoCard title="Wallet source analytics" detail="Wallet analytics could not be loaded from the billing API." />;
  const totals = analytics?.sourceTotals || {};
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <InfoCard title="Wallet source analytics" detail="No completed credit usage has been recorded for this account yet." />;
  const peak = Math.max(...entries.map(([, credits]) => credits), 1);
  return <Card><CardHeader><CardTitle>Wallet source analytics</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{Number(analytics?.totalConsumed ?? 0).toLocaleString()} credits consumed across {entries.length} funding source{entries.length === 1 ? '' : 's'} ({analytics?.period}).</p>{entries.map(([source, credits]) => <div key={source} className="space-y-1"><div className="flex justify-between text-sm"><span className="font-medium">{analytics?.sourceLabels?.[source] || source}</span><span className="text-muted-foreground">{credits.toLocaleString()}</span></div><Progress value={Math.round((credits / peak) * 100)} aria-label={`${source} credits consumed`} /></div>)}</CardContent></Card>;
}

export function FreeUsageCard({ usage }: { usage: TvceFreeUsage[] }) {
  if (!usage.length) return <InfoCard title="Free plan details" detail="The billing service has not reported free-plan allowances for this account yet." />;
  return <Card><CardHeader><CardTitle>Free plan details</CardTitle></CardHeader><CardContent className="space-y-3">{usage.map(row => { const quota = Number(row.quota || 0); const used = Number(row.used || 0); const percent = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0; return <div key={row.capability} className="space-y-1"><div className="flex justify-between text-sm"><span className="font-medium">{formatCapability(row.capability)}</span><span className="text-muted-foreground">{used} / {quota}</span></div><Progress value={percent} aria-label={`${row.capability} free usage`} /></div>; })}<p className="text-xs text-muted-foreground">Included free usage resets {String(usage[0]?.period || 'monthly').replace('_', ' ')}.</p></CardContent></Card>;
}

export function CreditsConsumedCard({ consumedThisPeriod, lifetimeCreditsUsed }: { consumedThisPeriod?: number; lifetimeCreditsUsed: number }) {
  return <Card><CardHeader><CardTitle>Credits consumed</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-end justify-between"><span className="text-3xl font-semibold tracking-tight">{Number(consumedThisPeriod ?? 0).toLocaleString()}</span><span className="text-sm text-muted-foreground">this month</span></div><p className="text-sm text-muted-foreground">{Number(lifetimeCreditsUsed ?? 0).toLocaleString()} credits consumed in total.</p></CardContent></Card>;
}

function formatCapability(capability: string): string {
  return capability.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
}
