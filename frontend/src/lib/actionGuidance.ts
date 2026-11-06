// frontend/src/lib/actionGuidance.ts
//
// Converts raw error codes and platform state into clear, actionable guidance
// telling users why they can't proceed and what exact steps to take.

import { toast } from "sonner";

export interface ActionGuidance {
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}

export function getActionGuidanceForError(errorCode: string): ActionGuidance {
  const normalized = String(errorCode || "").toLowerCase();

  if (normalized.includes("kyc") || normalized.includes("identity_verification")) {
    return {
      title: "Identity Verification Required",
      description: "Paid gigs and premium opportunities require an approved KYC identity verification to ensure trust and compliance.",
      actionLabel: "Complete KYC in Verification Center →",
      actionPath: "/settings?tab=verification",
    };
  }

  if (normalized.includes("subscription") || normalized.includes("plan") || normalized.includes("entitlement")) {
    return {
      title: "Active Qualifying Subscription Required",
      description: "Applying to paid professional gigs requires an active qualifying subscription or credit entitlement.",
      actionLabel: "View Billing & Plans →",
      actionPath: "/wallet?tab=plans",
    };
  }

  if (normalized.includes("self_application")) {
    return {
      title: "Cannot Apply to Your Own Opportunity",
      description: "You are listed as the poster/owner of this opportunity. You can manage or delete it from your opportunities list.",
    };
  }

  if (normalized.includes("closed") || normalized.includes("expired")) {
    return {
      title: "Opportunity Closed or Expired",
      description: "This opportunity has reached its application deadline or has been marked as filled/closed by the poster.",
    };
  }

  if (normalized.includes("already_applied")) {
    return {
      title: "Already Applied",
      description: "You have already submitted an application or expressed interest in this opportunity. Check your applications tab for status updates.",
    };
  }

  return {
      title: "Action Cannot Be Completed",
      description: errorCode || "An unexpected error occurred. Please check your account status and try again.",
  };
}

export function handleActionError(err: unknown, fallbackMessage = "Operation failed") {
  const message = err instanceof Error ? err.message : String(err);
  const guidance = getActionGuidanceForError(message);

  toast.error(guidance.title, {
    description: guidance.description,
    duration: 6000,
    ...(guidance.actionPath ? {
      action: {
        label: guidance.actionLabel || "Take Action",
        onClick: () => {
          window.location.href = guidance.actionPath!;
        },
      },
    } : {}),
  });
}
