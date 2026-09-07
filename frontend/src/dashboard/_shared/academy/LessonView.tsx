import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, Send } from "lucide-react";
import type { AcademyCurriculum, AcademyModule } from "@/lib/api/academy";
import {
  completeAcademyModule,
  heartbeatAcademyModule,
  saveAcademyReflection,
  scoreAcademyQuiz,
  startAcademyModule,
  submitAcademyExercise,
} from "@/lib/api/academy";

export function LessonView({
  curriculum,
  module,
  onBack,
  onRefresh,
}: {
  curriculum: AcademyCurriculum;
  module: AcademyModule;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [sessionId, setSessionId] = useState("");
  const [reflection, setReflection] = useState("");
  const [exercise, setExercise] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (module.status === "complete") return;
    startAcademyModule(curriculum.id, module.id)
      .then((result) => setSessionId(result.sessionId))
      .catch(() => setMessage("This module is not currently unlocked."));
  }, [curriculum.id, module.id, module.status]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(
      () => void heartbeatAcademyModule(curriculum.id, module.id, sessionId),
      30000,
    );
    return () => window.clearInterval(timer);
  }, [curriculum.id, module.id, sessionId]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
      onRefresh();
    } catch {
      setMessage("The request could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-[#0066ff] dark:hover:text-[#58a6ff] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to curriculum
      </button>

      {/* Header Banner */}
      <header className="rounded-2xl border border-[#0066ff]/20 dark:border-[#0066ff]/35 bg-gradient-to-br from-[#0066ff]/5 to-[#58a6ff]/10 dark:from-[#0066ff]/10 dark:to-[#58a6ff]/15 p-6 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,102,255,0.05)]">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <span className="text-[#0066ff] dark:text-[#58a6ff]">{module.phase}</span>
          <span>·</span>
          <span>{module.priority}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Clock3 className="h-3.5 w-3.5 text-[#0066ff] dark:text-[#58a6ff]" />
            {module.estimatedHours} hours
          </span>
        </div>
        <h1 className="mt-3 text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {module.title}
        </h1>
        <p className="mt-2 text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
          {module.description}
        </p>
        <p className="mt-4 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Project:{" "}
          <span className="font-bold text-slate-800 dark:text-slate-200">{module.projectName}</span>
        </p>
      </header>

      {/* Overview & Key Concepts */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Why this matters now</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-normal">
          {module.content.whyNow}
        </p>

        <h2 className="mt-6 text-base font-bold text-slate-900 dark:text-white">Read and apply</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-normal">
          {module.content.overview}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {module.content.keyConcepts.map((concept) => (
            <div
              key={concept}
              className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.03] p-3.5 text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {concept}
            </div>
          ))}
        </div>

        <ol className="mt-6 space-y-3">
          {module.content.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0066ff]/10 dark:bg-[#0066ff]/20 text-xs font-bold text-[#0066ff] dark:text-[#58a6ff]">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Founder & Company Cases */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Founder and company cases</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {module.content.caseStudies.map((item) => (
            <article
              key={item.company}
              className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.company}</h3>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.outcome === "success"
                        ? "text-[#20c937] bg-[#20c937]/10"
                        : "text-amber-500 bg-amber-500/10"
                    }`}
                  >
                    {item.outcome}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-normal">
                  {item.story}
                </p>
                <p className="mt-2.5 text-xs text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-slate-900 dark:text-white">Lesson:</span> {item.lesson}
                </p>
              </div>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline"
              >
                {item.sourceTitle}
                <ExternalLink className="h-3 w-3" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Project Exercise */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Project exercise</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {module.content.exercise.instructions}
        </p>
        <textarea
          value={exercise}
          onChange={(event) => setExercise(event.target.value)}
          rows={6}
          className="mt-4 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all font-normal"
          placeholder="Submit your project-specific work..."
        />
        <button
          type="button"
          disabled={busy || exercise.trim().length < 40}
          onClick={() =>
            void run(
              () => submitAcademyExercise(curriculum.id, module.id, exercise),
              "Exercise submitted for review.",
            )
          }
          className="mt-3.5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" /> Submit exercise
        </button>
      </section>

      {/* Reflection */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Reflection</h2>
        <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">
          {module.content.reflection}
        </p>
        <textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          rows={4}
          className="mt-4 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all font-normal"
          placeholder="Write at least 20 characters..."
        />
        <button
          type="button"
          disabled={busy || reflection.trim().length < 20}
          onClick={() =>
            void run(
              () => saveAcademyReflection(curriculum.id, module.id, reflection),
              "Reflection saved.",
            )
          }
          className="mt-3.5 rounded-xl border border-black/[0.08] dark:border-white/10 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors disabled:opacity-40"
        >
          Save reflection
        </button>
      </section>

      {/* Knowledge Check */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Knowledge check</h2>
        {module.assessment.map((question, index) => (
          <div key={question.id} className="mt-5 border-b border-black/[0.04] dark:border-white/[0.06] pb-4 last:border-b-0 last:pb-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{question.question}</p>
            <div className="mt-3 grid gap-2">
              {question.options.map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setAnswers((current) => {
                      const next = [...current];
                      next[index] = optionIndex;
                      return next;
                    })
                  }
                  className={`rounded-xl border p-3 text-left text-sm font-medium transition-all ${
                    answers[index] === optionIndex
                      ? "border-[#0066ff] bg-[#0066ff]/10 dark:bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff]"
                      : "border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-black/[0.12] dark:hover:border-white/20"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={busy || answers.length !== module.assessment.length}
          onClick={() =>
            void run(
              () => scoreAcademyQuiz(curriculum.id, module.id, answers),
              "Knowledge check submitted.",
            )
          }
          className="mt-6 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit knowledge check
        </button>
      </section>

      {/* Completion section */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <button
          type="button"
          disabled={busy || module.status === "complete"}
          onClick={() =>
            void run(
              () => completeAcademyModule(curriculum.id, module.id),
              "Module completed by the backend.",
            )
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="h-4 w-4" />
          {module.status === "complete" ? "Completed" : "Complete module"}
        </button>
        {message && (
          <p className="mt-3 text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff]">{message}</p>
        )}
      </section>
    </div>
  );
}
