import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, ShoppingCart, Sparkles, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  createWalletPaymentIntent, EMPTY_WALLET_SUMMARY, fetchBillingPlans, fetchCreditPackages,
  fetchWalletSummary, fetchWalletTransactions,
  type BillingPlan, type CreditPackage, type WalletSummary as WalletSummaryData, type WalletTransaction,
} from '@/lib/api/wallet';
import {
  CreditPackCard, EmptyWalletState, UpgradeCard, WalletAlert, WalletCard, WalletSkeleton,
  WalletSummary, WalletTransactionDrawer, WalletTransactionTable,
} from './components';

type View = 'home' | 'purchase' | 'transactions' | 'plans';

export default function Wallet() {
  const [view, setView] = useState<View>('home');
  const [summary, setSummary] = useState<WalletSummaryData>(EMPTY_WALLET_SUMMARY);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const [wallet, history, packs, planRows] = await Promise.all([
        fetchWalletSummary(), fetchWalletTransactions(), fetchCreditPackages(), fetchBillingPlans(),
      ]);
      setSummary(wallet); setTransactions(history); setPackages(packs); setPlans(planRows); setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load wallet.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(true); }, [load]);

  const selectPackage = async (pack: CreditPackage) => {
    if (pack.amount === undefined || !pack.currency) { toast.error('Payment unavailable: the billing API did not provide a payable amount and currency.'); return; }
    try {
      const result = await createWalletPaymentIntent({ amount: pack.amount, currency: pack.currency, credits: pack.credits, provider: 'wallet' });
      toast.success(`Payment intent created with status ${result.paymentIntent.status}.`);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Payment unavailable.'); }
  };

  const buckets = summary.wallets || [];

  return <div className="min-h-dvh bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-primary" /><div><p className="font-semibold">TechIT Wallet</p><p className="hidden text-xs text-muted-foreground sm:block">Credits, usage, and billing activity</p></div></div><div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => void load()} disabled={refreshing} aria-label="Refresh wallet"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></Button><Badge variant="secondary">{summary.creditBalance.toLocaleString()} available</Badge></div></div></header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24 sm:px-6 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Wallet overview</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Your credits, clearly accounted for.</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Every value shown here comes directly from the TechIT billing API.</p></div><div className="flex gap-2"><Button onClick={() => setView('purchase')}><ShoppingCart className="mr-2 h-4 w-4" />Buy credits</Button><Button variant="outline" onClick={() => setView('plans')}><Sparkles className="mr-2 h-4 w-4" />Upgrade</Button></div></div>
      {error && <WalletAlert><p className="font-medium">Unable to load wallet</p><p>{error}</p><Button className="mt-2" size="sm" variant="outline" onClick={() => void load()}>Retry</Button></WalletAlert>}
      {!error && loading && <WalletSkeleton />}
      {!error && !loading && view === 'home' && <>
        {(summary.expirationAlerts || []).map(alert => <WalletAlert key={alert.walletId}><p>{alert.message}</p><p className="text-xs">Expires {new Date(alert.expiresAt).toLocaleDateString()}</p></WalletAlert>)}
        {summary.lowBalance && <WalletAlert><p className="font-medium">Low credit balance</p><p>You are running low on credits. Buy more credits or upgrade your plan.</p></WalletAlert>}
        {buckets.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{buckets.map(wallet => <WalletCard key={wallet.id} wallet={wallet} />)}</div> : <WalletAlert tone="info"><p className="font-medium">Detailed wallet balances are not available yet.</p><p>The current API exposes only the aggregate balance. Welcome, Monthly, Subscription, and PAYG cards will appear when the billing service returns them.</p></WalletAlert>}
        {buckets.length > 0 && <WalletSummary wallets={buckets} deductionOrder={summary.deductionOrder || []} />}
        {summary.restriction && <UpgradeCard restriction={summary.restriction} onUpgrade={() => setView('plans')} onBuy={() => setView('purchase')} />}
        <div className="grid gap-4 lg:grid-cols-3"><UnavailableCard title="Subscription usage" detail="The current billing API does not expose included, consumed, remaining, renewal, or effective-value fields." /><UnavailableCard title="Wallet source analytics" detail="The current billing API does not expose source breakdowns or daily, weekly, and monthly analytics." /><UnavailableCard title="Free plan details" detail="Free-plan allowances and premium-task restrictions will be rendered when supplied by the billing API." /></div>
        <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]"><UnavailableCard title="Credits consumed" detail="No ledger analytics endpoint is currently available." /><Card><CardHeader><CardTitle>Quick actions</CardTitle></CardHeader><CardContent className="grid gap-2"><Button variant="outline" onClick={() => setView('purchase')}>Buy Credits</Button><Button variant="outline" onClick={() => setView('plans')}>Upgrade Plan</Button><Button variant="outline" onClick={() => setView('transactions')}>View Transactions</Button><Button variant="outline" onClick={() => void load()}>Refresh Wallet</Button></CardContent></Card></div>
        {transactions.length ? <WalletTransactionTable transactions={transactions.slice(0, 5)} onSelect={setSelectedTransaction} /> : <EmptyWalletState onStart={() => setView('purchase')} />}
      </>}
      {!error && !loading && view === 'transactions' && <section className="space-y-4"><Back onClick={() => setView('home')} /><h2 className="text-2xl font-semibold">Transactions</h2>{transactions.length ? <WalletTransactionTable transactions={transactions} onSelect={setSelectedTransaction} /> : <EmptyWalletState onStart={() => setView('purchase')} />}</section>}
      {!error && !loading && view === 'purchase' && <section className="space-y-4"><Back onClick={() => setView('home')} /><div><h2 className="text-2xl font-semibold">Buy credits</h2><p className="text-sm text-muted-foreground">Prices, currency, bonuses, and credits are rendered exactly as supplied by the backend.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{packages.length ? packages.map(pack => <CreditPackCard key={pack.id} pack={pack} onSelect={selectPackage} />) : <UnavailableCard title="Payment unavailable" detail="The billing API returned no credit packs." />}</div></section>}
      {!error && !loading && view === 'plans' && <section className="space-y-4"><Back onClick={() => setView('home')} /><div><h2 className="text-2xl font-semibold">Upgrade your plan</h2><p className="text-sm text-muted-foreground">Plans and capabilities are rendered from the billing API.</p></div><div className="grid gap-4 md:grid-cols-3">{plans.length ? plans.map(plan => <Card key={plan.id}><CardHeader><CardTitle>{plan.name}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-lg font-semibold">{plan.priceNGN || plan.priceUSD || 'Price unavailable'}</p><p className="text-sm text-muted-foreground">{plan.credits || 'Credit allowance unavailable'}</p><ul className="space-y-1 text-sm text-muted-foreground">{(plan.features || []).map(feature => <li key={feature}>• {feature}</li>)}</ul><Button className="w-full" onClick={() => toast.info('Upgrade checkout is not exposed by the current billing API.')}>Upgrade</Button></CardContent></Card>) : <UnavailableCard title="Upgrade unavailable" detail="The billing API returned no subscription plans." />}</div></section>}
    </main><div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-2 border-t bg-background/95 p-3 backdrop-blur sm:hidden"><Button size="sm" onClick={() => setView('purchase')}>Buy</Button><Button size="sm" variant="outline" onClick={() => setView('transactions')}>History</Button><Button size="sm" variant="outline" onClick={() => void load()}>Refresh</Button></div><WalletTransactionDrawer transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
  </div>;
}

function Back({ onClick }: { onClick: () => void }) { return <Button variant="ghost" onClick={onClick}><ArrowLeft className="mr-2 h-4 w-4" />Wallet overview</Button>; }
function UnavailableCard({ title, detail }: { title: string; detail: string }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{detail}</p></CardContent></Card>; }
