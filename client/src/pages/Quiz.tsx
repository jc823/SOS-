import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ChevronLeft, BarChart3, DollarSign, Trophy, Loader2 } from "lucide-react";
import { BOOKING_URL } from "@/const";
import {
  QUIZ_QUESTIONS,
  GATE_AFTER_INDEX,
  computeQuizResult,
  type QuizResult,
} from "@/lib/quiz-engine";
import { sendLeadToGHL } from "@/lib/webhooks";
import { trpc } from "@/lib/trpc";

type Step = "quiz" | "gate" | "results";

const GRADE_COLORS: Record<string, string> = {
  A: "text-[#2ECC71]",
  B: "text-[#4CAF50]",
  C: "text-[#D4A843]",
  D: "text-[#E67E22]",
  F: "text-[#E74C3C]",
};

const BAND_COLORS: Record<string, string> = {
  "Scaling Ready": "text-[#2ECC71]",
  "Building Momentum": "text-[#4CAF50]",
  "Needs Focus": "text-[#D4A843]",
  "At Risk": "text-[#E74C3C]",
};

export default function Quiz() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<1 | 2>(1); // 1 = pre-gate, 2 = post-gate

  // Gate form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateLoading, setGateLoading] = useState(false);

  const [result, setResult] = useState<QuizResult | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const quizRegister = trpc.auth.quizRegister.useMutation();

  // Auto-redirect after results — must be at top level, not inside if block
  useEffect(() => {
    if (step !== "results" || !result) return;
    const timer = setTimeout(() => {
      setRedirecting(true);
      setTimeout(() => navigate("/portal"), 1500);
    }, 6000);
    return () => clearTimeout(timer);
  }, [step, result]);

  const phaseQuestions = phase === 1
    ? QUIZ_QUESTIONS.slice(0, GATE_AFTER_INDEX + 1)
    : QUIZ_QUESTIONS.slice(GATE_AFTER_INDEX + 1);

  const currentQuestion = phase === 1
    ? phaseQuestions[currentIndex]
    : phaseQuestions[currentIndex];

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = QUIZ_QUESTIONS.length;
  const progressPct = Math.round((totalAnswered / totalQuestions) * 100);

  function handleAnswer(value: number) {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (phase === 1) {
      if (currentIndex < phaseQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // End of phase 1 — show gate
        setStep("gate");
      }
    } else {
      if (currentIndex < phaseQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All done — compute results
        const r = computeQuizResult(newAnswers);
        setResult(r);
        setStep("results");
      }
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (phase === 2) {
      setStep("gate");
    }
  }

  async function handleGateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setGateError("All fields are required.");
      return;
    }
    setGateLoading(true);
    setGateError("");

    const phase1Score = Object.values(answers).reduce((s, v) => s + v, 0);

    // Fire GHL webhook + silently create/login account
    await Promise.allSettled([
      sendLeadToGHL({ name, email, phone, partialScore: phase1Score }),
      quizRegister.mutateAsync({ name, email, phone, partialScore: phase1Score }),
    ]);

    setGateLoading(false);
    setPhase(2);
    setCurrentIndex(0);
    setStep("quiz");
  }

  // ── Quiz view ──────────────────────────────────────────────────────────────
  if (step === "quiz") {
    const globalIndex = phase === 1 ? currentIndex : GATE_AFTER_INDEX + 1 + currentIndex;

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-[11px] font-medium tracking-widest uppercase text-gold/60 mb-4">
                <BarChart3 size={12} />
                SOS Scorecard — Free Assessment
              </div>
              <div className="text-xs text-muted-foreground">
                Question {globalIndex + 1} of {totalQuestions}
              </div>
            </div>

            {/* Question */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 sm:p-8">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-gold/60 mb-3">
                {currentQuestion.pillar}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-6 leading-snug">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-gold/50 hover:bg-gold/5 transition-all duration-150 text-sm text-white/80 hover:text-white"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Back button */}
            {(currentIndex > 0 || phase === 2) && (
              <button
                onClick={handleBack}
                className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors mx-auto"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Gate view ──────────────────────────────────────────────────────────────
  if (step === "gate") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={20} className="text-gold" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're halfway there</h2>
            <p className="text-sm text-muted-foreground">
              Enter your info to continue and see your full results.
            </p>
          </div>

          <form onSubmit={handleGateSubmit} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Your Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Email Address *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@myshop.com"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 block">Phone Number *</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="bg-white/5 border-white/10"
              />
            </div>

            {gateError && (
              <p className="text-xs text-red-400">{gateError}</p>
            )}

            <Button
              type="submit"
              disabled={gateLoading}
              className="w-full h-11 bg-gold text-black font-bold hover:bg-gold/90"
            >
              {gateLoading ? "Saving..." : "Continue to My Results →"}
            </Button>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              A Scale Detailing specialist may reach out to discuss your results. No spam.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ── Results view ───────────────────────────────────────────────────────────
  if (step === "results" && result) {
    const gradeColor = GRADE_COLORS[result.grade] ?? "text-white";
    const bandColor = BAND_COLORS[result.band] ?? "text-white";

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-[11px] font-medium tracking-widest uppercase text-gold/60 mb-4">
              <Trophy size={12} />
              Your SOS Score
            </div>
            <div className={`text-8xl font-black mb-2 ${gradeColor}`}>{result.grade}</div>
            <div className={`text-xl font-bold mb-1 ${bandColor}`}>{result.band}</div>
            <div className="text-sm text-muted-foreground">{result.percentage}% overall score</div>
          </div>

          {/* Revenue gap */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
              <DollarSign size={16} className="text-gold" />
              Estimated monthly revenue gap
            </div>
            <div className="text-4xl font-black text-white">
              ${result.revenueGap.toLocaleString()}
              <span className="text-lg font-normal text-muted-foreground">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your shop is leaving an estimated ${result.revenueGap.toLocaleString()}/month on the table.
            </p>
          </div>

          {/* Pillar breakdown */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Pillar Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(result.pillarScores).map(([pillar, { pct }]) => (
                <div key={pillar}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">{pillar}</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 70 ? "#4CAF50" : pct >= 50 ? "#D4A843" : "#E74C3C",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portal redirect notice */}
          <div className={`border rounded-2xl p-5 mb-6 text-center transition-all ${redirecting ? "border-gold/40 bg-gold/5" : "border-white/8 bg-white/[0.03]"}`}>
            {redirecting ? (
              <div className="flex items-center justify-center gap-2 text-gold font-semibold text-sm">
                <Loader2 size={16} className="animate-spin" />
                Taking you to your portal…
              </div>
            ) : (
              <>
                <p className="text-sm font-bold mb-1">✓ Your account is ready</p>
                <p className="text-xs text-muted-foreground mb-3">
                  We saved your results. You'll be redirected to your portal in a few seconds.
                </p>
                <Button
                  size="sm"
                  className="bg-gold text-black font-bold hover:bg-gold/90 text-xs h-8 px-4"
                  onClick={() => navigate("/portal")}
                >
                  Go to My Portal Now <ArrowRight size={12} className="ml-1" />
                </Button>
              </>
            )}
          </div>

          {/* CTA */}
          <div className="bg-white/[0.03] border border-gold/20 rounded-2xl p-8 text-center mb-6">
            <h3 className="text-xl font-black mb-3">Ready to close the gap?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              A full professional SOS assessment includes detailed action plans, revenue projections, and a personalized 90-day growth roadmap.
            </p>
            <Button
              className="h-12 px-8 bg-gold text-black font-bold hover:bg-gold/90 text-sm"
              onClick={() => window.open(BOOKING_URL, "_blank")}
            >
              Book a Free Strategy Call <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          {/* Login link */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => navigate("/portal")} className="text-gold hover:underline">
              Go to your portal →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
