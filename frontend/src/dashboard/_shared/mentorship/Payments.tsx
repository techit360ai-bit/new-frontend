import { AlertCircle, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export function Payments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-3xl">Payments &amp; Equity</h1>
        <p className="text-muted-foreground">Persisted mentorship billing and agreements</p>
      </div>
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="font-semibold">No mentorship billing contract</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Mentorship transactions, invoices, and equity agreements will remain empty until they have a persisted owner and endpoint.
          </p>
          <Link
            to="/wallet"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <CreditCard className="h-4 w-4" />
            Open Wallet
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
