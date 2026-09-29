import { useState } from "react";
import { AlertCircle, ArrowRight, Lock, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  hasAnyProvider,
  providerLabel,
  startCheckout,
  type CheckoutTarget,
  type ProviderAvailability,
} from "@/lib/billing/checkout";
import type { CheckoutProvider } from "@/lib/api/tvce";

export interface CheckoutItem {
  kind: "package" | "plan";
  id: string;
  name: string;
  credits?: number;
  amount?: number;
  currency?: string;
  priceLabel?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  item: CheckoutItem | null;
  providers: ProviderAvailability;
  email?: string;
  onClose: () => void;
}

const PROVIDERS: CheckoutProvider[] = ["stripe", "paystack", "flutterwave"];

export default function PaymentModal({ isOpen, item, providers, email, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const enabledProviders = PROVIDERS.filter((provider) => providers[provider]);
  const canContinue = Boolean(item.id) && enabledProviders.length > 0;

  const handleClose = () => {
    setLoading(false);
    setError(null);
    onClose();
  };

  const handleContinue = async () => {
    if (!canContinue || loading) return;
    setLoading(true);
    setError(null);
    const target: CheckoutTarget = item.kind === "package"
      ? { packageId: item.id, amount: item.amount, currency: item.currency, credits: item.credits, name: item.name }
      : { planId: item.id, amount: item.amount, currency: item.currency, name: item.name };
    const outcome = await startCheckout(target, { providers, email });
    if (outcome.status === "redirecting") {
      window.location.assign(outcome.checkoutUrl);
      return;
    }
    setLoading(false);
    setError(outcome.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close payment dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
              <Lock className="h-4 w-4" />
              Secure checkout
            </div>
            <h2 className="text-xl font-bold">{item.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.priceLabel || (item.credits ? `${item.credits.toLocaleString()} credits` : "Continue to the payment provider to complete this purchase.")}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={handleClose} aria-label="Close payment dialog">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {canContinue ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                You will be redirected to{" "}
                <span className="font-medium text-foreground">
                  {enabledProviders.map(providerLabel).join(" / ")}
                </span>{" "}
                to pay. Credits are granted only after the provider confirms payment.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button className="w-full" onClick={() => void handleContinue()} disabled={loading}>
              {loading ? "Starting checkout..." : "Continue to secure checkout"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-status-warning/60 bg-status-warning-soft p-4 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                No payment provider is enabled for this deployment yet. Checkout cannot start and
                nothing has been charged.
              </p>
            </div>
            <Button className="w-full" variant="outline" onClick={handleClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}
