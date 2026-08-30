import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchContract,
  countersignContract,
  type Contract,
} from "@/lib/api/contracts";
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  PenTool,
  AlertCircle,
  User,
  Briefcase,
  Calendar,
  Percent,
  Timer,
  Shield,
  Eraser,
} from "lucide-react";

type PageState = "loading" | "error" | "empty" | "ready";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: Contract["status"]) {
  switch (status) {
    case "draft":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border-default bg-background-primary px-2.5 py-0.5 text-xs font-medium text-text-muted">
          <FileText className="h-3 w-3" /> Draft
        </span>
      );
    case "pending-signature":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-status-warning bg-status-warning-soft px-2.5 py-0.5 text-xs font-medium text-status-warning">
          <Clock className="h-3 w-3" /> Pending Signature
        </span>
      );
    case "pending-countersign":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
          <PenTool className="h-3 w-3" /> Pending Countersign
        </span>
      );
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-status-success bg-status-success-soft px-2.5 py-0.5 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-3 w-3" /> Active
        </span>
      );
    default:
      return null;
  }
}

export default function ContractSigningPage() {
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get("id");
  const { profile } = useAuth();

  const [contract, setContract] = useState<Contract | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [signing, setSigning] = useState(false);

  // Canvas signature state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Load contract
  useEffect(() => {
    if (!contractId) {
      setPageState("empty");
      return;
    }
    let cancelled = false;
    setPageState("loading");

    fetchContract(contractId)
      .then((c) => {
        if (cancelled) return;
        setContract(c);
        setPageState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Failed to load contract");
        setPageState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [contractId]);

  // Canvas drawing logic
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) {
        const touch = e.touches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [],
  );

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      const { x, y } = getCanvasCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [getCanvasCoords],
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = getCanvasCoords(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#4c1d95";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      setHasDrawn(true);
    },
    [isDrawing, getCanvasCoords],
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const handleCountersign = async () => {
    if (!contract) return;
    if (!hasDrawn) {
      toast.error("Please draw your signature before submitting.");
      return;
    }
    setSigning(true);
    try {
      const updated = await countersignContract(contract.id);
      setContract(updated);
      toast.success("Contract countersigned successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to countersign";
      toast.error(msg);
    } finally {
      setSigning(false);
    }
  };

  const founderAlreadySigned = Boolean(contract?.founderSignedAt);
  const collaboratorSigned = Boolean(contract?.collaboratorSignedAt);
  const isFounder = profile?.id === contract?.founderId;
  const canCountersign =
    isFounder && contract?.status === "pending-countersign" && !founderAlreadySigned;

  // ── Loading state ──
  if (pageState === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // ── Empty state ──
  if (pageState === "empty") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-text-muted">
        <FileText className="h-12 w-12 text-text-on-inverse-secondary" />
        <p className="text-lg font-medium">No contract selected</p>
        <p className="text-sm">Please provide a contract ID via the URL parameter <code>?id=xxx</code>.</p>
      </div>
    );
  }

  // ── Error state ──
  if (pageState === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-rose-600">
        <AlertCircle className="h-12 w-12 text-rose-300" />
        <p className="text-lg font-medium">Error loading contract</p>
        <p className="text-sm text-text-muted">{errorMsg}</p>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Contract Signing</h1>
          <p className="mt-1 text-sm text-text-muted">
            Review and countersign the collaboration agreement
          </p>
        </div>
        {statusBadge(contract.status)}
      </div>

      {/* Contract Terms Card */}
      <div className="rounded-xl border border-violet-100 bg-surface-primary shadow-sm">
        <div className="border-b border-violet-50 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-violet-900">
            <Shield className="h-5 w-5 text-violet-500" />
            Contract Terms
          </h2>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {/* Project Name */}
          <div className="flex items-start gap-3">
            <Briefcase className="mt-0.5 h-4 w-4 text-violet-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-disabled">Project</p>
              <p className="text-sm font-medium text-text-primary">{contract.projectName}</p>
            </div>
          </div>

          {/* Collaborator */}
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 text-violet-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-disabled">Collaborator</p>
              <p className="text-sm font-medium text-text-primary">{contract.collaboratorName}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-3">
            <Briefcase className="mt-0.5 h-4 w-4 text-violet-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-disabled">Role</p>
              <p className="text-sm font-medium text-text-primary">{contract.role}</p>
            </div>
          </div>

          {/* Equity */}
          <div className="flex items-start gap-3">
            <Percent className="mt-0.5 h-4 w-4 text-violet-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-disabled">Equity</p>
              <p className="text-sm font-medium text-text-primary">{contract.equityPercent}%</p>
            </div>
          </div>

          {/* Weekly Hours */}
          <div className="flex items-start gap-3">
            <Timer className="mt-0.5 h-4 w-4 text-violet-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-disabled">Weekly Hours</p>
              <p className="text-sm font-medium text-text-primary">{contract.weeklyHours}h / week</p>
            </div>
          </div>

          {/* Vesting */}
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 text-violet-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-disabled">Vesting</p>
              <p className="text-sm font-medium text-text-primary">
                {contract.vestingMonths} months ({contract.cliffMonths}-month cliff)
              </p>
            </div>
          </div>

          {/* Skills */}
          <div className="flex items-start gap-3 sm:col-span-2">
            <PenTool className="mt-0.5 h-4 w-4 text-violet-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-disabled">Skills</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {contract.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-violet-100 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signing Timeline */}
      <div className="rounded-xl border border-violet-100 bg-surface-primary shadow-sm">
        <div className="border-b border-violet-50 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-violet-900">
            <Clock className="h-5 w-5 text-violet-500" />
            Signing Timeline
          </h2>
        </div>

        <div className="space-y-4 p-6">
          {/* Collaborator Signature */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                collaboratorSigned
                  ? "bg-status-success-soft text-status-success"
                  : "bg-surface-secondary text-text-disabled"
              }`}
            >
              {collaboratorSigned ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                Collaborator Signature
                {collaboratorSigned && (
                  <span className="ml-2 text-xs text-status-success">Signed</span>
                )}
              </p>
              <p className="text-xs text-text-muted">
                {collaboratorSigned
                  ? formatDate(contract.collaboratorSignedAt)
                  : "Awaiting signature"}
              </p>
            </div>
          </div>

          {/* Founder Countersignature */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                founderAlreadySigned
                  ? "bg-status-success-soft text-status-success"
                  : "bg-surface-secondary text-text-disabled"
              }`}
            >
              {founderAlreadySigned ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                Founder Countersignature
                {founderAlreadySigned && (
                  <span className="ml-2 text-xs text-status-success">Signed</span>
                )}
              </p>
              <p className="text-xs text-text-muted">
                {founderAlreadySigned
                  ? formatDate(contract.founderSignedAt)
                  : "Awaiting countersignature"}
              </p>
            </div>
          </div>

          {/* Contract created */}
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Contract Created</p>
              <p className="text-xs text-text-muted">{formatDate(contract.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* E-Signature Section */}
      {canCountersign && (
        <div className="rounded-xl border border-violet-100 bg-surface-primary shadow-sm">
          <div className="border-b border-violet-50 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-violet-900">
              <PenTool className="h-5 w-5 text-violet-500" />
              Your Signature
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Draw your signature below to countersign this contract
            </p>
          </div>

          <div className="p-6">
            <div className="relative rounded-lg border-2 border-dashed border-violet-200 bg-violet-50/30">
              <canvas
                ref={canvasRef}
                width={600}
                height={180}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-violet-300">Draw your signature here</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-xs font-medium text-text-muted transition hover:bg-background-primary"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </button>

              <button
                type="button"
                onClick={handleCountersign}
                disabled={signing || !hasDrawn}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PenTool className="h-4 w-4" />
                )}
                {signing ? "Signing..." : "Countersign Contract"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already signed message for founder */}
      {isFounder && founderAlreadySigned && (
        <div className="rounded-xl border border-status-success bg-status-success-soft p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-status-success" />
            <div>
              <p className="font-medium text-status-success">You have signed this contract</p>
              <p className="text-sm text-status-success">
                Countersigned on {formatDate(contract.founderSignedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for collaborator */}
      {isFounder && contract.status === "pending-signature" && (
        <div className="rounded-xl border border-status-warning bg-status-warning-soft p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-status-warning" />
            <div>
              <p className="font-medium text-status-warning">Waiting for collaborator signature</p>
              <p className="text-sm text-status-warning">
                The collaborator has not yet signed this contract.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contract is active */}
      {contract.status === "active" && (
        <div className="rounded-xl border border-status-success bg-status-success-soft p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-status-success" />
            <div>
              <p className="font-medium text-status-success">Contract is fully executed</p>
              <p className="text-sm text-status-success">
                Both parties have signed. This contract is now active.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
