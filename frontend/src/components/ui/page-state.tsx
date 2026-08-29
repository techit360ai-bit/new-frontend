import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Inbox, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type PageStateTone = "loading" | "empty" | "error" | "success";

const stateIcon = {
  loading: LoaderCircle,
  empty: Inbox,
  error: AlertCircle,
  success: CheckCircle2,
};

export function PageState({
  tone,
  title,
  description,
  action,
  className,
}: {
  tone: PageStateTone;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = stateIcon[tone];
  return (
    <div
      className={cn("app-surface flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center", className)}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <Icon className={cn("h-6 w-6 text-muted-foreground", tone === "loading" && "animate-spin", tone === "error" && "text-destructive", tone === "success" && "text-emerald-600")} aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageLoadingState({ label = "Loading live data" }: { label?: string }) {
  return <PageState tone="loading" title={label} />;
}

export function PageEmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <PageState tone="empty" title={title} description={description} action={action} />;
}

export function PageErrorState({ title = "Something went wrong", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <PageState tone="error" title={title} description={description} action={action} />;
}

export function PageSuccessState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <PageState tone="success" title={title} description={description} action={action} />;
}
