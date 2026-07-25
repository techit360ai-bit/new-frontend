import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  ReceiptText,
  X,
} from "lucide-react";
import {
  createWalletPaymentIntent,
  type PaymentIntentResponse,
} from "@/lib/api/wallet";

interface Plan {
  id: string;
  name: string;
  priceNGN: string;
  priceUSD: string;
  credits: string;
  amount?: number;
  currency?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  currency: "NGN" | "USD";
}

function numericCredits(value: string): number {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyLabel(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function PaymentModal({
  isOpen,
  onClose,
  plan,
  currency,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<PaymentIntentResponse["paymentIntent"] | null>(null);
  const persistedAmount = Number(plan.amount ?? 0);
  const persistedCurrency = plan.currency || currency;
  const credits = useMemo(() => numericCredits(plan.credits), [plan.credits]);
  const displayPrice = currency === "NGN" ? plan.priceNGN : plan.priceUSD;
  const canCreateIntent = persistedAmount > 0 && credits > 0;

  if (!isOpen) return null;

  const handleClose = () => {
    setLoading(false);
    setError(null);
    setIntent(null);
    onClose();
  };

  const handleCreateIntent = async () => {
    if (!canCreateIntent || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createWalletPaymentIntent({
        amount: persistedAmount,
        currency: persistedCurrency,
        credits,
        provider: "wallet",
        idemKey: `plan-${plan.id}-${Date.now()}`,
      });
      setIntent(result.paymentIntent);
    } catch (createError) {
      setIntent(null);
      setError(
        createError instanceof Error
          ? createError.message
          : "The payment intent could not be created.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close payment dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Lock className="h-4 w-4" />
              Persisted payment intent
            </div>
            <h2 className="text-xl font-bold text-white">{plan.name}</h2>
            <p className="mt-1 text-sm text-slate-400">
              Display price: {displayPrice} for {plan.credits}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            title="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {intent ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-700 bg-emerald-950/40 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-200">Payment intent created</p>
                <p className="mt-1 text-sm text-emerald-100/70">
                  The plan is not active until the persisted payment status is completed by the billing provider.
                </p>
              </div>
            </div>
            <dl className="divide-y divide-slate-700 rounded-lg border border-slate-700 bg-slate-800/50 px-4">
              <IntentRow label="Intent ID" value={intent.id} />
              <IntentRow label="Status" value={intent.status || "pending"} />
              <IntentRow label="Amount" value={moneyLabel(intent.amount, intent.currency)} />
              <IntentRow label="Credits" value={intent.credits.toLocaleString()} />
            </dl>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg bg-cyan-600 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              Return to Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center gap-3">
                <ReceiptText className="h-6 w-6 text-cyan-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Canonical billing request</p>
                  <p className="mt-1 text-xs text-slate-400">
                    The backend will record the intent before any payment can be completed.
                  </p>
                </div>
              </div>
            </div>

            {!canCreateIntent && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-700 bg-amber-950/40 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                <p className="text-sm text-amber-100">
                  This plan does not include a persisted numeric amount and credit quantity, so a payment intent cannot be created.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-700 bg-red-950/40 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <p className="text-sm text-red-100">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleCreateIntent()}
              disabled={!canCreateIntent || loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating intent...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Create Payment Intent
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function IntentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="max-w-[65%] truncate text-right font-medium text-white" title={value}>{value}</dd>
    </div>
  );
}
