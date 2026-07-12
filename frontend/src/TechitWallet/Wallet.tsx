import {
  CreditCard,
  TrendingUp,
  Zap,
  Database,
  Sparkles,
  Rocket,
  Clock,
  BarChart3,
  X,
  Play,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import PaymentModal from "../components/PaymentModal";
import { formatRelative } from "@/lib/formatRelative";
import {
  EMPTY_WALLET_SUMMARY,
  createWalletPaymentIntent,
  fetchBillingPlans,
  fetchCreditPackages,
  fetchWalletSummary,
  fetchWalletTransactions,
  fetchWalletUsage,
  type BillingPlan,
  type CreditPackage,
  type WalletSummary,
  type WalletTransaction,
  type WalletUsageEvent,
} from "@/lib/api/wallet";

const bottomCards = [
  {
    title: "Upgrade Plan",
    description: "Get more credits monthly",
    icon: CreditCard,
    color: "border-violet-500/50",
  },
  {
    title: "Usage Analytics",
    description: "See detailed breakdowns",
    icon: TrendingUp,
    color: "border-cyan-500/50",
  },
  {
    title: "Run Automation",
    description: "Preview credit cost",
    icon: Clock,
    color: "border-teal-500/50",
  },
];

const pricingFeatures = [
  {
    icon: Clock,
    title: "Credits Never Expire",
    description:
      "Use your credits anytime. They roll over month to month, so you never lose what you paid for.",
  },
  {
    icon: Zap,
    title: "Flexible Usage",
    description:
      "Use credits across all features: AI code generation, automation, pipelines, and more.",
  },
  {
    icon: Rocket,
    title: "Scale As You Grow",
    description:
      "Start small and upgrade anytime. Buy extra credits when you need them.",
  },
];

type PricingPlan = BillingPlan & {
  id: string;
  name: string;
  priceNGN: string;
  priceUSD: string;
  credits: string;
  features: string[];
};

type DisplayPackage = CreditPackage & {
  id: string;
  name: string;
  credits: number;
  price: string;
  usdPrice: string;
};

function moneyLabel(value: unknown, currency = "USD") {
  if (typeof value === "string" && value.trim()) return value;
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function normalizePackage(pkg: CreditPackage): DisplayPackage {
  return {
    ...pkg,
    id: String(pkg.id),
    name: pkg.name || "Credit package",
    credits: Number(pkg.credits || 0),
    price: pkg.priceNGN || pkg.price || moneyLabel(pkg.amount, pkg.currency || "USD"),
    usdPrice: pkg.priceUSD || pkg.usdPrice || moneyLabel(pkg.amount, "USD"),
    popular: Boolean(pkg.popular),
  };
}

function normalizePlan(plan: BillingPlan): PricingPlan {
  const credits = typeof plan.credits === "string" ? plan.credits : `${Number(plan.credits ?? 0).toLocaleString()} credits`;
  return {
    ...plan,
    id: String(plan.id),
    name: plan.name || "Billing plan",
    priceNGN: plan.priceNGN || moneyLabel(plan.amount, plan.currency || "USD"),
    priceUSD: plan.priceUSD || moneyLabel(plan.amount, "USD"),
    credits,
    features: plan.features ?? [],
    popular: Boolean(plan.popular),
  };
}

export default function Wallet() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewUsageOpen, setIsViewUsageOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
  const [summary, setSummary] = useState<WalletSummary>(EMPTY_WALLET_SUMMARY);
  const [usage, setUsage] = useState<WalletUsageEvent[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [packages, setPackages] = useState<DisplayPackage[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);

  // PaymentModal state — holds the plan the user clicked "Get Started" on
  const [paymentPlan, setPaymentPlan] = useState<PricingPlan | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchWalletSummary(),
      fetchWalletUsage(),
      fetchWalletTransactions(),
      fetchCreditPackages(),
      fetchBillingPlans(),
    ])
      .then(([summaryData, usageData, transactionData, packageData, planData]) => {
        if (!alive) return;
        setSummary(summaryData);
        setUsage(usageData);
        setTransactions(transactionData);
        setPackages(packageData.map(normalizePackage));
        setPlans(planData.map(normalizePlan));
        setWalletError(null);
      })
      .catch((error) => {
        if (!alive) return;
        setSummary(EMPTY_WALLET_SUMMARY);
        setUsage([]);
        setTransactions([]);
        setPackages([]);
        setPlans([]);
        setWalletError(error instanceof Error ? error.message : "Live wallet data is unavailable.");
      });
    return () => { alive = false; };
  }, []);

  const recentUsage = useMemo(() => usage.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title || item.feature || item.description || "Credit usage",
    time: item.createdAt || item.timestamp ? formatRelative(String(item.createdAt || item.timestamp)) : "Recorded",
    credits: `-${Math.abs(Number(item.credits || 0)).toLocaleString()}`,
  })), [usage]);

  const usageTotal = usage.reduce((sum, item) => sum + Math.abs(Number(item.credits || 0)), 0);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openViewUsage = () => setIsViewUsageOpen(true);
  const closeViewUsage = () => setIsViewUsageOpen(false);
  const openPlans = () => setIsPlansOpen(true);
  const closePlans = () => setIsPlansOpen(false);

  // Opens PaymentModal for the selected plan (also closes Plans modal)
  const handleGetStarted = (plan: PricingPlan) => {
    closePlans();
    setPaymentPlan(plan);
  };

  const handleSelectPackage = async (pkg: DisplayPackage) => {
    try {
      await createWalletPaymentIntent({
        amount: Number(pkg.amount || 0),
        currency: pkg.currency || "USD",
        credits: pkg.credits,
        provider: "wallet",
        idemKey: `wallet-${pkg.id}-${Date.now()}`,
      });
      toast("Payment intent created. Complete payment from your billing provider.");
    } catch (error) {
      toast(`Could not create payment intent: ${error instanceof Error ? error.message : "backend unavailable"}.`);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      {/* Main content */}
      <main className="flex-1 min-h-dvh overflow-y-auto bg-linear-to-b from-slate-50 via-violet-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        {/* Top Navigation */}
        <div className="border-b border-violet-200/50 dark:border-violet-800/50 bg-linear-to-r from-sky-50 to-violet-50 dark:from-slate-900/50 dark:to-purple-900/50 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold bg-linear-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    TechIT
                  </span>
                </div>
                <nav className="flex items-center gap-6 text-sm">
                  <button className="text-violet-600 dark:text-violet-400 font-medium border-b-2 border-violet-600 dark:border-violet-400 pb-1">
                    Wallet
                  </button>
                  <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Pricing
                  </button>
                  <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Analytics
                  </button>
                </nav>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-linear-to-r from-violet-100 to-cyan-100 dark:from-violet-950/40 dark:to-cyan-950/40 px-4 py-2 rounded-full border border-violet-300 dark:border-violet-800/50">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {summary.creditBalance.toLocaleString()} Credits
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
          {walletError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Live wallet records could not be loaded: {walletError}
            </div>
          )}
          {/* Main Credit Card */}
          <div className="rounded-3xl bg-linear-to-br from-violet-600 via-violet-500 to-cyan-500 border border-violet-400/50 dark:border-violet-600/50 px-8 py-8 space-y-6 shadow-xl shadow-violet-500/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-cyan-400" />
                  <span className="text-sm text-slate-300">TechIT Credits</span>
                </div>
                <h2 className="text-5xl font-bold text-white">{summary.creditBalance.toLocaleString()}</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Used</p>
                  <p className="text-2xl font-bold text-cyan-400">{summary.lifetimeCreditsUsed.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-emerald-400">{summary.pendingPayments.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button
                onClick={openModal}
                className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2.5 transition-colors"
              >
                Buy Credits
              </button>
              <button
                onClick={openViewUsage}
                className="w-full rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white font-semibold py-2.5 transition-colors"
              >
                View Usage
              </button>
              <button
                onClick={openPlans}
                className="w-full rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white font-semibold py-2.5 transition-colors"
              >
                Plans
              </button>
              <button className="w-full rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white font-semibold py-2.5 transition-colors">
                History
              </button>
            </div>
          </div>

          {/* Charts and Recent Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Credits Spent Chart */}
            <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 px-6 py-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Credits Spent
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Last 7 days</p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>

              {usage.length > 0 ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total credits used</p>
                    <p className="text-4xl font-bold text-cyan-400 mt-2">{usageTotal.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    {usage.slice(0, 7).map((event) => {
                      const credits = Math.abs(Number(event.credits || 0));
                      const width = usageTotal > 0 ? Math.max(4, Math.round((credits / usageTotal) * 100)) : 4;
                      return (
                        <div key={event.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{event.title || event.feature || "Usage event"}</span>
                            <span>{credits.toLocaleString()} credits</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-cyan-500" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-400">
                  No credit usage has been recorded yet.
                </div>
              )}
            </div>

            {/* Recent Usage */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-6 py-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">
                  Recent Usage
                </h3>
              </div>
              <div className="space-y-3">
                {recentUsage.length > 0 ? recentUsage.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg bg-cyan-500/10 px-3 py-3 border border-slate-700/50"
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10"
                      >
                        <Clock className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400">{item.time}</p>
                      </div>
                      <span className="text-sm font-semibold text-cyan-400 whitespace-nowrap">
                        {item.credits}
                      </span>
                    </div>
                )) : (
                  <p className="text-sm text-slate-400">No recent usage recorded.</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {bottomCards.map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl bg-slate-900/80 border ${card.color} px-6 py-6 space-y-3 hover:border-opacity-100 transition-all cursor-pointer group`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {card.description}
                      </p>
                    </div>
                    <IconComponent className="h-5 w-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="flex items-center text-xs text-cyan-400 group-hover:gap-1 transition-all">
                    <span>Learn more</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/*  Buy Credits Modal  */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeModal}
            />
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-slate-400 hover:text-white" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Buy TechIT Credits
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Choose the perfect pack for your needs
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {packages.length > 0 ? packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative rounded-xl border p-6 space-y-4 transition-all ${
                      pkg.popular
                        ? "border-cyan-500/50 bg-slate-800/50"
                        : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/50"
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {pkg.name}
                      </h3>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-cyan-400">
                        {pkg.credits}
                      </p>
                      <p className="text-xs text-slate-400">credits</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {pkg.price}
                      </p>
                      <p className="text-xs text-slate-400">/ {pkg.usdPrice}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSelectPackage(pkg)}
                      className={`w-full rounded-lg py-2.5 font-semibold transition-colors ${
                        pkg.popular
                          ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                      }`}
                    >
                      Select Pack
                    </button>
                  </div>
                )) : (
                  <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                    No credit packages are available for this account.
                  </div>
                )}
              </div>
              <div className="rounded-lg bg-slate-800/50 border border-slate-700 px-4 py-3 flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 mt-0.5 shrink-0">
                  <span className="text-xs text-cyan-400">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Credits never expire
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Use your credits anytime for AI automation, pipelines, and
                    more
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/*  View Usage Modal */}
        {isViewUsageOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeViewUsage}
            />
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full space-y-6">
              <button
                onClick={closeViewUsage}
                className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-slate-400 hover:text-white" />
              </button>
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-purple-600 to-purple-800">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Usage Details
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Persisted credit usage and wallet transactions for this account.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-cyan-500/50 bg-slate-800/50 px-6 py-4 text-center space-y-1">
                <p className="text-sm text-slate-400">Current balance</p>
                <p className="text-4xl font-bold text-cyan-400">{summary.creditBalance.toLocaleString()} credits</p>
                <p className="text-xs text-slate-400">{summary.lifetimeCreditsUsed.toLocaleString()} credits used lifetime</p>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[...usage, ...transactions].slice(0, 8).map((item) => {
                  const credits = Number("credits" in item ? item.credits ?? ("deltaCredits" in item ? item.deltaCredits : 0) : 0);
                  const label = "title" in item ? item.title : undefined;
                  const timestamp = "createdAt" in item ? item.createdAt : undefined;
                  return (
                    <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-left">
                      <p className="text-sm font-medium text-white">{label || item.description || "Wallet record"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {timestamp ? formatRelative(String(timestamp)) : "Recorded"} · {credits ? `${credits.toLocaleString()} credits` : "No credit delta"}
                      </p>
                    </div>
                  );
                })}
                {usage.length === 0 && transactions.length === 0 && (
                  <p className="text-sm text-slate-400 text-center">No wallet usage or transactions are recorded yet.</p>
                )}
                <button
                  onClick={closeViewUsage}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white font-semibold py-3 transition-colors"
                >
                  Cancel
                </button>
                <button className="w-full rounded-xl border border-cyan-500/50 bg-slate-800/30 hover:bg-slate-800/50 text-cyan-400 font-semibold py-3 transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Buy More Credits
                </button>
              </div>
              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Current balance:{" "}
                  <span className="text-white font-semibold">
                    {summary.creditBalance.toLocaleString()} credits
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/*  Pricing Plans Modal  */}
        {isPlansOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
              onClick={closePlans}
            />
            <div className="relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              <button
                onClick={closePlans}
                className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10"
              >
                <X className="h-6 w-6 text-slate-400 hover:text-white" />
              </button>
              <div className="overflow-y-auto flex-1 px-6 sm:px-8 pt-6 sm:pt-8">
                <div className="text-center space-y-2 pb-8">
                  <div className="inline-block bg-cyan-500/20 border border-cyan-500/50 rounded-full px-4 py-1">
                    <span className="text-sm font-semibold text-cyan-400">
                      Simple, transparent pricing
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    Power your software execution with{" "}
                    <span className="text-cyan-400">TechIT Credits</span>
                  </h2>
                  <p className="text-sm sm:text-base text-slate-400">
                    Run AI, automation, pipelines, and deployments using
                    flexible credits. Only pay for what you use.
                  </p>
                </div>

                {/* Currency Toggle */}
                <div className="flex items-center justify-center gap-3 pb-6">
                  <button
                    onClick={() => setCurrency("NGN")}
                    className={`px-6 py-2 rounded-full font-semibold transition-all text-sm ${
                      currency === "NGN"
                        ? "bg-cyan-500 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    ₦ NGN
                  </button>
                  <button
                    onClick={() => setCurrency("USD")}
                    className={`px-6 py-2 rounded-full font-semibold transition-all text-sm ${
                      currency === "USD"
                        ? "bg-cyan-500 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    $ USD
                  </button>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
                  {plans.length > 0 ? plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border p-5 space-y-4 transition-all ${
                        plan.popular
                          ? "border-cyan-500/50 bg-slate-800/80 sm:col-span-2 lg:col-span-1"
                          : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Most Popular
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {plan.name}
                        </h3>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-cyan-400">
                          {currency === "NGN" ? plan.priceNGN : plan.priceUSD}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {plan.credits}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs"
                          >
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 mt-0.5 shrink-0">
                              <span className="text-xs text-cyan-400">✓</span>
                            </div>
                            <span className="text-slate-300">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* ── Get Started → opens PaymentModal ── */}
                      <button
                        onClick={() => handleGetStarted(plan)}
                        className={`w-full rounded-lg py-2 font-semibold transition-all text-xs ${
                          plan.popular
                            ? "bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                        }`}
                      >
                        Get Started
                      </button>
                    </div>
                  )) : (
                    <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                      No billing plans are available for this account.
                    </div>
                  )}
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-6">
                  {pricingFeatures.map((feature, idx) => {
                    const IconComponent = feature.icon;
                    return (
                      <div
                        key={idx}
                        className="rounded-xl bg-linear-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-3 sm:p-4 space-y-2 hover:border-slate-600 transition-all"
                      >
                        <IconComponent className="h-5 w-5 text-cyan-400" />
                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Plan Section */}
                <div className="rounded-2xl bg-linear-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/20 p-4 sm:p-6 text-center space-y-2 pb-8">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Need a custom plan?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    We offer custom pricing for large teams and enterprises with
                    specific needs.
                  </p>
                  <button className="mx-auto rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold px-4 sm:px-6 py-2 transition-colors text-xs">
                    Contact Sales
                  </button>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="border-t border-slate-700 p-4 bg-linear-to-t from-slate-950 to-transparent">
                <button
                  onClick={closePlans}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white font-semibold py-3 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentPlan && (
          <PaymentModal
            isOpen={!!paymentPlan}
            onClose={() => setPaymentPlan(null)}
            plan={paymentPlan}
            currency={currency}
          />
        )}
      </main>
    </div>
  );
}
