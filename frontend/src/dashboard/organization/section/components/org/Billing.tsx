import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Gauge,
  Receipt,
  RefreshCw,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  EMPTY_WALLET_SUMMARY,
  fetchBillingPlans,
  fetchWalletInvoices,
  fetchWalletSubscriptions,
  fetchWalletSummary,
  fetchWalletTransactions,
  fetchWalletUsage,
  type BillingPlan,
  type WalletInvoice,
  type WalletSubscription,
  type WalletSummary,
  type WalletTransaction,
  type WalletUsageEvent,
} from "@/lib/api/wallet";

interface UsageTrend {
  key: string;
  label: string;
  credits: number;
}

interface UsageCategory {
  name: string;
  credits: number;
}

interface PaymentMethodView {
  brand: string;
  last4: string;
  expiry: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyLabel(value: unknown, currency = "USD"): string {
  if (typeof value === "string" && value.trim() && !Number.isFinite(Number(value))) {
    return value;
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(asNumber(value));
}

function dateLabel(value: unknown): string {
  const text = asText(value);
  if (!text) return "No date";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleDateString();
}

function usageDate(event: WalletUsageEvent): Date | null {
  const value = event.createdAt || event.timestamp;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function usageCredits(event: WalletUsageEvent): number {
  return Math.abs(asNumber(event.credits));
}

function buildUsageTrend(events: WalletUsageEvent[]): UsageTrend[] {
  const months = new Map<string, UsageTrend>();
  for (const event of events) {
    const date = usageDate(event);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = months.get(key) ?? {
      key,
      label: date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      credits: 0,
    };
    current.credits += usageCredits(event);
    months.set(key, current);
  }
  return [...months.values()].sort((left, right) => left.key.localeCompare(right.key)).slice(-6);
}

function buildUsageCategories(events: WalletUsageEvent[]): UsageCategory[] {
  const categories = new Map<string, number>();
  for (const event of events) {
    const name = event.feature || event.title || event.description || "Credit usage";
    categories.set(name, (categories.get(name) ?? 0) + usageCredits(event));
  }
  return [...categories.entries()]
    .map(([name, credits]) => ({ name, credits }))
    .sort((left, right) => right.credits - left.credits)
    .slice(0, 6);
}

function currentMonthUsage(events: WalletUsageEvent[]): number {
  const now = new Date();
  return events.reduce((total, event) => {
    const date = usageDate(event);
    return date &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
      ? total + usageCredits(event)
      : total;
  }, 0);
}

function subscriptionPlan(
  subscription: WalletSubscription | null,
  plans: BillingPlan[],
): BillingPlan | null {
  if (!subscription) return null;
  const planId = asText(subscription.planId);
  const planName = asText(subscription.planName).toLowerCase();
  return plans.find((plan) =>
    (planId && String(plan.id) === planId) ||
    (planName && plan.name.toLowerCase() === planName)
  ) ?? null;
}

function paymentMethodFrom(summary: WalletSummary): PaymentMethodView | null {
  const account = asRecord(summary.account);
  const nested = asRecord(account.paymentMethod || account.defaultPaymentMethod);
  const last4 = asText(nested.last4 || account.last4);
  if (!last4) return null;
  const brand = asText(nested.brand || account.cardBrand) || "Card";
  const month = asText(nested.expiryMonth || nested.expMonth || account.expiryMonth);
  const year = asText(nested.expiryYear || nested.expYear || account.expiryYear);
  return {
    brand,
    last4,
    expiry: month && year ? `${month}/${year}` : "No expiry recorded",
  };
}

function invoiceDownloadUrl(invoice: WalletInvoice): string {
  return asText(invoice.invoiceUrl || invoice.downloadUrl || invoice.receiptUrl);
}

function statusTone(status: string): string {
  const value = status.toLowerCase();
  if (value.includes("paid") || value.includes("active") || value.includes("complete")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value.includes("pending") || value.includes("processing")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (value.includes("failed") || value.includes("past") || value.includes("cancel")) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-gray-200 bg-gray-50 text-gray-700";
}

export function Billing() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<WalletSummary>(EMPTY_WALLET_SUMMARY);
  const [usage, setUsage] = useState<WalletUsageEvent[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<WalletSubscription[]>([]);
  const [invoices, setInvoices] = useState<WalletInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBilling = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, usageData, transactionData, planData, subscriptionData, invoiceData] =
        await Promise.all([
          fetchWalletSummary(),
          fetchWalletUsage(),
          fetchWalletTransactions(),
          fetchBillingPlans(),
          fetchWalletSubscriptions(),
          fetchWalletInvoices(),
        ]);
      setSummary(summaryData);
      setUsage(usageData);
      setTransactions(transactionData);
      setPlans(planData);
      setSubscriptions(subscriptionData);
      setInvoices(invoiceData);
    } catch (loadError) {
      setSummary(EMPTY_WALLET_SUMMARY);
      setUsage([]);
      setTransactions([]);
      setPlans([]);
      setSubscriptions([]);
      setInvoices([]);
      setError(loadError instanceof Error ? loadError.message : "Live billing data is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBilling();
  }, []);

  const activeSubscription =
    subscriptions.find((subscription) => asText(subscription.status).toLowerCase() === "active") ??
    subscriptions[0] ??
    null;
  const activePlan = subscriptionPlan(activeSubscription, plans);
  const usageTrend = useMemo(() => buildUsageTrend(usage), [usage]);
  const usageCategories = useMemo(() => buildUsageCategories(usage), [usage]);
  const usedThisMonth = useMemo(() => currentMonthUsage(usage), [usage]);
  const paymentMethod = paymentMethodFrom(summary);
  const account = asRecord(summary.account);
  const monthlyLimit = asNumber(account.monthlyCreditLimit || account.creditLimit);
  const usagePercent = monthlyLimit > 0
    ? Math.min(100, Math.round((usedThisMonth / monthlyLimit) * 100))
    : null;
  const planCurrency =
    asText(activeSubscription?.currency) ||
    asText(activePlan?.currency) ||
    "USD";
  const planPrice =
    (planCurrency.toUpperCase() === "NGN"
      ? activePlan?.priceNGN || activePlan?.priceUSD
      : activePlan?.priceUSD || activePlan?.priceNGN) ||
    (activeSubscription ? moneyLabel(activeSubscription.amount, planCurrency) : "");

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing &amp; Usage</h1>
          <p className="mt-2 text-gray-600">
            Persisted subscription, credit usage, invoices, and payment status
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/wallet")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#20C997] px-5 text-sm font-semibold text-white hover:bg-[#1ab386]"
        >
          <WalletCards className="h-5 w-5" />
          Open Wallet
        </button>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading persisted billing data...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-7 w-7 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadBilling()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="mb-8 rounded-lg border border-[#20C997]/20 bg-[#20C997]/10 p-6 lg:p-8">
            {activeSubscription ? (
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {activePlan?.name || activeSubscription.planName || "Persisted subscription"}
                    </h2>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusTone(asText(activeSubscription.status))}`}>
                      {asText(activeSubscription.status) || "Status unavailable"}
                    </span>
                  </div>
                  {activePlan?.features?.length ? (
                    <p className="max-w-2xl text-sm text-gray-700">
                      {activePlan.features.slice(0, 3).join(" · ")}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      No persisted plan feature summary is available.
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {planPrice || "Price unavailable"}
                    </span>
                    {activeSubscription.currentPeriodEnd && (
                      <span className="text-sm text-gray-600">
                        renews {dateLabel(activeSubscription.currentPeriodEnd)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/wallet")}
                  className="rounded-lg border border-[#20C997]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#20C997] hover:bg-[#20C997]/10"
                >
                  View Plans
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">No active subscription</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {plans.length > 0
                      ? `${plans.length} persisted billing plan${plans.length === 1 ? "" : "s"} available.`
                      : "No billing plans are available for this account."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/wallet")}
                  className="rounded-lg bg-[#20C997] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1ab386]"
                >
                  Manage Plans
                </button>
              </div>
            )}
          </section>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Credit Balance"
              value={summary.creditBalance.toLocaleString()}
              icon={Zap}
              tone="purple"
            />
            <MetricCard
              label="Used This Month"
              value={usedThisMonth.toLocaleString()}
              icon={Gauge}
              tone="orange"
            />
            <MetricCard
              label="Lifetime Credits Used"
              value={summary.lifetimeCreditsUsed.toLocaleString()}
              icon={CheckCircle2}
              tone="green"
            />
            <MetricCard
              label="Pending Payments"
              value={summary.pendingPayments.toLocaleString()}
              icon={Receipt}
              tone="blue"
            />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-bold text-gray-900">Usage Trends</h2>
              <p className="mb-6 text-sm text-gray-500">Persisted credit usage by month</p>
              {usageTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={usageTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="credits" fill="#20C997" name="Credits" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptySection
                  icon={Gauge}
                  title="No usage trend yet"
                  detail="Credit usage will appear here after persisted usage events are recorded."
                />
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-bold text-gray-900">Usage Breakdown</h2>
              <p className="mb-6 text-sm text-gray-500">Credits grouped by persisted feature labels</p>
              {usageCategories.length > 0 ? (
                <div className="space-y-5">
                  {usageCategories.map((category) => {
                    const total = usageCategories.reduce((sum, item) => sum + item.credits, 0);
                    const width = total > 0 ? Math.max(4, Math.round((category.credits / total) * 100)) : 0;
                    return (
                      <div key={category.name}>
                        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                          <span className="truncate font-medium text-gray-900">{category.name}</span>
                          <span className="flex-shrink-0 text-gray-600">
                            {category.credits.toLocaleString()} credits
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-[#20C997]" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptySection
                  icon={Zap}
                  title="No usage categories"
                  detail="No persisted feature usage has been recorded for this account."
                />
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Billing History</h2>
                  <p className="mt-1 text-sm text-gray-500">Persisted invoices</p>
                </div>
                <span className="text-xs font-medium text-gray-500">{invoices.length} records</span>
              </div>
              {invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.slice(0, 8).map((invoice) => {
                    const downloadUrl = invoiceDownloadUrl(invoice);
                    const currency = asText(invoice.currency) || "USD";
                    const amount = invoice.total ?? invoice.amount ?? 0;
                    const status = asText(invoice.status);
                    return (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {moneyLabel(amount, currency)}
                          </p>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {invoice.invoiceNumber || invoice.number || invoice.id}
                            {" · "}
                            {dateLabel(invoice.issuedAt || invoice.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-3">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(status)}`}>
                            {status || "Unknown"}
                          </span>
                          {downloadUrl ? (
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Download invoice"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          ) : (
                            <span
                              title="No invoice download is persisted"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300"
                            >
                              <Download className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptySection
                  icon={FileText}
                  title="No persisted invoices"
                  detail="Invoices will appear after a completed billing event."
                />
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-bold text-gray-900">Payment Method</h2>
              <p className="mb-6 text-sm text-gray-500">Canonical wallet account payment details</p>
              {paymentMethod ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-500">{paymentMethod.brand}</p>
                      <p className="mt-2 font-mono text-lg text-gray-900">•••• {paymentMethod.last4}</p>
                    </div>
                    <CreditCard className="h-7 w-7 text-[#20C997]" />
                  </div>
                  <p className="mt-6 text-sm text-gray-600">Expires {paymentMethod.expiry}</p>
                </div>
              ) : (
                <EmptySection
                  icon={CreditCard}
                  title="No persisted payment method"
                  detail="This screen will not display a placeholder card."
                />
              )}
              <button
                type="button"
                onClick={() => navigate("/wallet")}
                className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Manage in Wallet
              </button>
            </section>
          </div>

          {summary.pendingPayments > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <h3 className="font-medium text-amber-900">Payment action pending</h3>
                <p className="mt-1 text-sm text-amber-800">
                  {summary.pendingPayments} persisted payment
                  {summary.pendingPayments === 1 ? "" : "s"} still require completion.
                </p>
              </div>
            </div>
          )}

          {usagePercent !== null && usagePercent >= 80 && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <Gauge className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-900">Monthly credit limit</h3>
                <p className="mt-1 text-sm text-orange-800">
                  Persisted usage is at {usagePercent}% of the account limit.
                </p>
              </div>
            </div>
          )}

          {transactions.length > 0 && (
            <p className="mt-6 text-xs text-gray-500">
              {transactions.length} persisted wallet transaction
              {transactions.length === 1 ? "" : "s"} are available in Wallet.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Zap;
  tone: "purple" | "orange" | "green" | "blue";
}) {
  const tones = {
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-[#20C997]/10 text-[#20C997]",
  };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </div>
  );
}

function EmptySection({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Zap;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center">
      <Icon className="mb-3 h-7 w-7 text-gray-400" />
      <p className="font-medium text-gray-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{detail}</p>
    </div>
  );
}
