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
        <span className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400">
          <FileText className="h-3.5 w-3.5" /> Draft
        </span>
      );
    case "pending-signature":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Clock className="h-3.5 w-3.5" /> Pending Signature
        </span>
      );
    case "pending-countersign":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#0066ff]/30 bg-[#0066ff]/10 px-3 py-1 text-xs font-bold text-[#0066ff] dark:text-[#58a6ff]">
          <PenTool className="h-3.5 w-3.5" /> Pending Countersign
        </span>
      );
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#20c937]/30 bg-[#20c937]/10 px-3 py-1 text-xs font-bold text-[#20c937]">
          <CheckCircle2 className="h-3.5 w-3.5" /> Active
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
      ctx.strokeStyle = "#0066ff";
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
        <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
      </div>
    );
  }

  // ── Empty state ──
  if (pageState === "empty") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
        <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">No contract selected</p>
        <p className="text-sm">Please provide a contract ID via the URL parameter <code className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08]">?id=xxx</code>.</p>
      </div>
    );
  }

  // ── Error state ──
  if (pageState === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-12 w-12 text-rose-300 dark:text-rose-600" />
        <p className="text-lg font-bold">Error loading contract</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{errorMsg}</p>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Contract Signing</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Review and countersign the collaboration agreement
          </p>
        </div>
        {statusBadge(contract.status)}
      </div>

      {/* Contract Terms Card */}
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="border-b border-black/[0.06] dark:border-white/10 px-6 py-4 bg-white/40 dark:bg-white/[0.02]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Shield className="h-5 w-5 text-[#0066ff] dark:text-[#58a6ff]" />
            Contract Terms
          </h2>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {/* Project Name */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff] shrink-0">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Project</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{contract.projectName}</p>
            </div>
          </div>

          {/* Collaborator */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff] shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Collaborator</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{contract.collaboratorName}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff] shrink-0">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Role</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{contract.role}</p>
            </div>
          </div>

          {/* Equity */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff] shrink-0">
              <Percent className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Equity</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{contract.equityPercent}%</p>
            </div>
          </div>

          {/* Weekly Hours */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff] shrink-0">
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Weekly Hours</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{contract.weeklyHours}h / week</p>
            </div>
          </div>

          {/* Vesting */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff] shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Vesting</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {contract.vestingMonths} months ({contract.cliffMonths}-month cliff)
              </p>
            </div>
          </div>

          {/* Skills */}
          <div className="flex items-start gap-3 sm:col-span-2">
            <div className="w-8 h-8 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] dark:text-[#58a6ff] shrink-0">
              <PenTool className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Skills</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {contract.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-[#0066ff]/20 bg-[#0066ff]/10 dark:bg-[#0066ff]/20 px-2.5 py-1 text-xs font-semibold text-[#0066ff] dark:text-[#58a6ff]"
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
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="border-b border-black/[0.06] dark:border-white/10 px-6 py-4 bg-white/40 dark:bg-white/[0.02]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Clock className="h-5 w-5 text-[#0066ff] dark:text-[#58a6ff]" />
            Signing Timeline
          </h2>
        </div>

        <div className="space-y-4 p-6">
          {/* Collaborator Signature */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                collaboratorSigned
                  ? "bg-[#20c937]/15 text-[#20c937]"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-slate-400"
              }`}
            >
              {collaboratorSigned ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Collaborator Signature
                {collaboratorSigned && (
                  <span className="ml-2 text-xs font-bold text-[#20c937]">Signed</span>
                )}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {collaboratorSigned
                  ? formatDate(contract.collaboratorSignedAt)
                  : "Awaiting signature"}
              </p>
            </div>
          </div>

          {/* Founder Countersignature */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                founderAlreadySigned
                  ? "bg-[#20c937]/15 text-[#20c937]"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-slate-400"
              }`}
            >
              {founderAlreadySigned ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Founder Countersignature
                {founderAlreadySigned && (
                  <span className="ml-2 text-xs font-bold text-[#20c937]">Signed</span>
                )}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {founderAlreadySigned
                  ? formatDate(contract.founderSignedAt)
                  : "Awaiting countersignature"}
              </p>
            </div>
          </div>

          {/* Contract created */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff] shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Contract Created</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(contract.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* E-Signature Section */}
      {canCountersign && (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="border-b border-black/[0.06] dark:border-white/10 px-6 py-4 bg-white/40 dark:bg-white/[0.02]">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <PenTool className="h-5 w-5 text-[#0066ff] dark:text-[#58a6ff]" />
              Your Signature
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Draw your signature below to countersign this contract
            </p>
          </div>

          <div className="p-6">
            <div className="relative rounded-xl border-2 border-dashed border-black/[0.12] dark:border-white/15 bg-slate-50/50 dark:bg-black/30">
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
                  <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Draw your signature here</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </button>

              <button
                type="button"
                onClick={handleCountersign}
                disabled={signing || !hasDrawn}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white font-bold px-5 py-2.5 text-sm shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="rounded-2xl border border-[#20c937]/30 bg-[#20c937]/10 dark:bg-[#20c937]/15 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-[#20c937]" />
            <div>
              <p className="font-bold text-[#20c937]">You have signed this contract</p>
              <p className="text-sm font-medium text-[#20c937]/80">
                Countersigned on {formatDate(contract.founderSignedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for collaborator */}
      {isFounder && contract.status === "pending-signature" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-500" />
            <div>
              <p className="font-bold text-amber-700 dark:text-amber-400">Waiting for collaborator signature</p>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-300">
                The collaborator has not yet signed this contract.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contract is active */}
      {contract.status === "active" && (
        <div className="rounded-2xl border border-[#20c937]/30 bg-[#20c937]/10 dark:bg-[#20c937]/15 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-[#20c937]" />
            <div>
              <p className="font-bold text-[#20c937]">Contract is fully executed</p>
              <p className="text-sm font-medium text-[#20c937]/80">
                Both parties have signed. This contract is now active.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
