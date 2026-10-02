import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, ShoppingCart, Sparkles, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  EMPTY_WALLET_SUMMARY, fetchBillingPlans, fetchCreditPackages, fetchWalletAnalytics,
  fetchWalletSummary, fetchWalletTransactions,
  type BillingPlan, type CreditPackage, type WalletAnalytics, type WalletSummary as WalletSummaryData, type WalletTransaction,
} from '@/lib/api/wallet';
import { fetchFreeUsage, fetchCheckoutProviders, type TvceFreeUsage } from '@/lib/api/tvce';
import { NO_PROVIDER, type ProviderAvailability } from '@/lib/billing/checkout';
import { useAuth } from '@/contexts/AuthContext';
import PaymentModal, { type CheckoutItem } from '@/components/PaymentModal';
import {
  CreditPackCard, CreditsConsumedCard, EmptyWalletState, FreeUsageCard, InfoCard, SubscriptionUsageCard,
  UpgradeCard, WalletAlert, WalletAnalyticsCard, WalletCard, WalletSkeleton, WalletSummary,
  WalletTransactionDrawer, WalletTransactionTable,
} from './components';

type View = 'home' | 'purchase' | 'transactions' | 'plans';
type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

const ANALYTICS_PERIODS: AnalyticsPeriod[] = ['daily', 'weekly', 'monthly'];

function numericCredits(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export default function Wallet() {
  const { profile } = useAuth();
  const [view, setView] = useState<View>('home');
  const [summary, setSummary] = useState<WalletSummaryData>(EMPTY_WALLET_SUMMARY);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeUsage, setFreeUsage] = useState<TvceFreeUsage[]>([]);
  const [providers, setProviders] = useState<ProviderAvailability>(NO_PROVIDER);
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null);
  const [analyticsFailed, setAnalyticsFailed] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('daily');
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const [wallet, history, packs, planRows, tvceUsage, providerRows] = await Promise.all([
        fetchWalletSummary(), fetchWalletTransactions(), fetchCreditPackages(), fetchBillingPlans(), fetchFreeUsage(),
        fetchCheckoutProviders().catch(() => ({ providers: NO_PROVIDER })),
      ]);
      setSummary(wallet); setTransactions(history); setPackages(packs); setPlans(planRows);
      setFreeUsage(tvceUsage.usage); setProviders(providerRows.providers); setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load wallet.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(true); }, [load]);

  useEffect(() => {
    let active = true;
    fetchWalletAnalytics(analyticsPeriod)
      .then(result => { if (active) { setAnalytics(result); setAnalyticsFailed(false); } })
      .catch(() => { if (active) { setAnalytics(null); setAnalyticsFailed(true); } });
    return () => { active = false; };
  }, [analyticsPeriod]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('checkout');
    if (!status) return;
    if (status === 'success') toast.success('Payment received. Credits appear once the provider confirms the charge.');
    else if (status === 'cancelled') toast.info('Checkout cancelled. Nothing was charged.');
    params.delete('checkout');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  const selectPackage = (pack: CreditPackage) => setCheckoutItem({
    kind: 'package', id: pack.id, name: pack.name, credits: pack.credits, amount: pack.amount, currency: pack.currency,
    priceLabel: pack.price || pack.priceUSD || pack.priceNGN || undefined,
  });

  const selectPlan = (plan: BillingPlan) => setCheckoutItem({
    kind: 'plan', id: plan.id, name: plan.name, credits: numericCredits(plan.credits), amount: plan.amount, currency: plan.currency,
    priceLabel: plan.priceUSD || plan.priceNGN || (plan.amount ? `${plan.amount} ${plan.currency ?? ''}`.trim() : undefined),
  });

  const buckets = summary.wallets || [];

  return <div className="min-h-dvh bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-primary" /><div><p className="font-semibold">TechIT Wallet</p><p className="hidden text-xs text-muted-foreground sm:block">Credits, usage, and billing activity</p></div></div><div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => void load()} disabled={refreshing} aria-label="Refresh wallet"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></Button><Badge variant="secondary">{summary.creditBalance.toLocaleString()} available</Badge></div></div></header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24 sm:px-6 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Wallet overview</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Your credits, clearly accounted for.</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Every value shown here comes directly from the TechIT billing API. Checkout redirects to a hosted payment provider.</p></div><div className="flex gap-2"><Button onClick={() => setView('purchase')}><ShoppingCart className="mr-2 h-4 w-4" />Buy credits</Button><Button variant="outline" onClick={() => setView('plans')}><Sparkles className="mr-2 h-4 w-4" />Upgrade</Button></div></div>
      {error && <WalletAlert><p className="font-medium">Unable to load wallet</p><p>{error}</p><Button className="mt-2" size="sm" variant="outline" onClick={() => void load()}>Retry</Button></WalletAlert>}
      {!error && loading && <WalletSkeleton />}
      {!error && !loading && view === 'home' && <>
        {(summary.expirationAlerts || []).map(alert => <WalletAlert key={alert.walletId}><p className="font-medium">Credit expiry</p><p>{alert.message} ({new Date(alert.expiresAt).toLocaleDateString()})</p></WalletAlert>)}
        {summary.lowBalance && <WalletAlert><p className="font-medium">Low credit balance</p><p>You have {summary.creditBalance.toLocaleString()} credits. Buy credits to keep running tasks.</p><Button className="mt-2" size="sm" onClick={() => setView('purchase')}>Buy credits</Button></WalletAlert>}
        {buckets.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{buckets.map(wallet => <WalletCard key={wallet.id} wallet={wallet} />)}</div> : <InfoCard title="Detailed wallet balances" detail="The billing API exposes a single aggregate balance for this account. Per-wallet cards appear when the service returns separate wallet rows." />}
        {buckets.length > 0 && <WalletSummary wallets={buckets} deductionOrder={summary.deductionOrder || []} />}
        {summary.restriction && <UpgradeCard restriction={summary.restriction} onUpgrade={() => setView('plans')} onBuy={() => setView('purchase')} />}
        <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-medium text-muted-foreground">Consumption &amp; allowances</h2><div className="flex gap-1">{ANALYTICS_PERIODS.map(period => <Button key={period} size="sm" variant={analyticsPeriod === period ? 'default' : 'ghost'} onClick={() => setAnalyticsPeriod(period)}>{period}</Button>)}</div></div>
        <div className="grid gap-4 lg:grid-cols-3"><SubscriptionUsageCard usage={summary.subscriptionUsage} /><WalletAnalyticsCard analytics={analytics} error={analyticsFailed} /><FreeUsageCard usage={freeUsage} /></div>
        <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]"><CreditsConsumedCard consumedThisPeriod={summary.consumedThisPeriod} lifetimeCreditsUsed={summary.lifetimeCreditsUsed} /><Card><CardHeader><CardTitle>Quick actions</CardTitle></CardHeader><CardContent className="grid gap-2"><Button variant="outline" onClick={() => setView('purchase')}>Buy Credits</Button><Button variant="outline" onClick={() => setView('plans')}>Upgrade Plan</Button><Button variant="outline" onClick={() => setView('transactions')}>View Transactions</Button><Button variant="outline" onClick={() => void load()}>Refresh Wallet</Button></CardContent></Card></div>
        {transactions.length ? <WalletTransactionTable transactions={transactions.slice(0, 5)} onSelect={setSelectedTransaction} /> : <EmptyWalletState onStart={() => setView('purchase')} />}
      </>}
      {!error && !loading && view === 'transactions' && <section className="space-y-4"><Back onClick={() => setView('home')} /><h2 className="text-2xl font-semibold">Transactions</h2>{transactions.length ? <WalletTransactionTable transactions={transactions} onSelect={setSelectedTransaction} /> : <EmptyWalletState onStart={() => setView('purchase')} />}</section>}
      {!error && !loading && view === 'purchase' && <section className="space-y-4"><Back onClick={() => setView('home')} /><div><h2 className="text-2xl font-semibold">Buy credits</h2><p className="text-sm text-muted-foreground">Prices, currency, bonuses, and credits are rendered exactly as supplied by the backend. Payment is completed on the provider's hosted page.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{packages.length ? packages.map(pack => <CreditPackCard key={pack.id} pack={pack} onSelect={selectPackage} />) : <InfoCard title="Payment unavailable" detail="The billing API returned no credit packs. An administrator can add them in the commercial configuration." />}</div></section>}
      {!error && !loading && view === 'plans' && <section className="space-y-4"><Back onClick={() => setView('home')} /><div><h2 className="text-2xl font-semibold">Upgrade your plan</h2><p className="text-sm text-muted-foreground">Plans and capabilities are rendered from the billing API. Upgrade redirects to the provider's hosted checkout.</p></div><div className="grid gap-4 md:grid-cols-3">{plans.length ? plans.map(plan => <Card key={plan.id}><CardHeader><CardTitle>{plan.name}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-lg font-semibold">{plan.priceNGN || plan.priceUSD || 'Price shown at checkout'}</p><p className="text-sm text-muted-foreground">{plan.credits || 'Credit allowance shown at checkout'}</p><ul className="space-y-1 text-sm text-muted-foreground">{(plan.features || []).map(feature => <li key={feature}>• {feature}</li>)}</ul><Button className="w-full" onClick={() => selectPlan(plan)}>Upgrade</Button></CardContent></Card>) : <InfoCard title="Upgrade unavailable" detail="The billing API returned no subscription plans. An administrator can add them in the commercial configuration." />}</div></section>}
    </main><div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-2 border-t bg-background/95 p-3 backdrop-blur sm:hidden"><Button size="sm" onClick={() => setView('purchase')}>Buy</Button><Button size="sm" variant="outline" onClick={() => setView('transactions')}>History</Button><Button size="sm" variant="outline" onClick={() => void load()}>Refresh</Button></div><WalletTransactionDrawer transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
    <PaymentModal isOpen={Boolean(checkoutItem)} item={checkoutItem} providers={providers} email={profile?.email} onClose={() => setCheckoutItem(null)} />
  </div>;
}

function Back({ onClick }: { onClick: () => void }) { return <Button variant="ghost" onClick={onClick}><ArrowLeft className="mr-2 h-4 w-4" />Wallet overview</Button>; }
