import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { BOOKING_URL } from "@/const";
import { computeRevenueGap } from "@/lib/quiz-engine";
import {
  BarChart3, Trophy, TrendingUp, Calendar, LogOut, Lock,
  ArrowRight, Loader2, DollarSign,
} from "lucide-react";

const BAND_COLORS: Record<string, string> = {
  Elite:               "text-[#2ECC71]",
  Strong:              "text-[#4CAF50]",
  Average:             "text-[#D4A843]",
  "Below Average":     "text-[#E67E22]",
  "Needs Attention":   "text-[#E74C3C]",
  "Scaling Ready":     "text-[#2ECC71]",
  "Building Momentum": "text-[#4CAF50]",
  "Needs Focus":       "text-[#D4A843]",
  "At Risk":           "text-[#E74C3C]",
};

function pillarColor(pct: number) {
  if (pct >= 70) return "#4CAF50";
  if (pct >= 50) return "#D4A843";
  return "#E74C3C";
}

export default function CustomerPortal() {
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.portal.myData.useQuery(undefined, {
    enabled: !loading && !!user,
    retry: false,
  });

  // ── Loading ──
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // ── No shop assigned yet ──
  if (!data?.shop) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
            <BarChart3 size={28} className="text-gold" />
          </div>
          <h1 className="text-2xl font-black mb-3">Your portal is being set up</h1>
          <p className="text-sm text-muted-foreground mb-8">
            A Scale Detailing specialist will link your shop to this account. You'll be notified
            when your results are ready to view.
          </p>
          <Button
            className="h-11 px-8 bg-gold text-black font-bold hover:bg-gold/90"
            onClick={() => window.open(BOOKING_URL, "_blank")}
          >
            Book a Strategy Call <ArrowRight size={16} className="ml-2" />
          </Button>
          <button
            onClick={() => logout()}
            className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mx-auto"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const { shop, latestAssessment, history } = data;
  const isUnlocked = shop.resultsUnlocked;
  const pct = latestAssessment?.overallPercentage ?? null;
  const band = latestAssessment?.overallBand ?? null;
  const bandColor = band ? (BAND_COLORS[band] ?? "text-white") : "text-white";
  const revenueGap = pct !== null ? computeRevenueGap(pct / 100) : null;

  // Parse pillar results stored as JSON
  let pillarResults: Record<string, { percentage: number }> | null = null;
  if (latestAssessment?.pillarResults) {
    try {
      const raw = typeof latestAssessment.pillarResults === "string"
        ? JSON.parse(latestAssessment.pillarResults)
        : latestAssessment.pillarResults;
      if (raw && typeof raw === "object") pillarResults = raw;
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-gold" />
            <span className="text-sm font-bold text-gold">SOS Scorecard</span>
            <span className="text-white/20 text-sm">·</span>
            <span className="text-sm text-white/60 truncate max-w-[180px]">{shop.name}</span>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gold/60 mb-1">Welcome back</p>
          <h1 className="text-2xl font-black">{shop.name}</h1>
        </div>

        {/* No assessment yet */}
        {!latestAssessment && (
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-8 text-center mb-6">
            <Trophy size={32} className="text-gold/40 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">No assessment on file yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Book a call with your Scale Detailing consultant to get your first SOS assessment.
            </p>
            <Button
              className="h-11 px-8 bg-gold text-black font-bold hover:bg-gold/90"
              onClick={() => window.open(BOOKING_URL, "_blank")}
            >
              Book a Strategy Call <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Score card */}
        {latestAssessment && pct !== null && (
          <>
            {/* Score + pillar breakdown */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 mb-4 relative overflow-hidden">
              {/* Lock overlay when results are locked */}
              {!isUnlocked && (
                <div className="absolute inset-0 backdrop-blur-md bg-black/60 z-10 flex flex-col items-center justify-center rounded-2xl px-8">
                  <Lock size={28} className="text-gold mb-3" />
                  <p className="text-sm font-bold mb-1 text-center">Your full report is locked</p>
                  <p className="text-xs text-muted-foreground mb-5 text-center">
                    Book a strategy call to unlock your complete SOS assessment and 90-day action plan.
                  </p>
                  <Button
                    className="h-10 px-6 bg-gold text-black font-bold hover:bg-gold/90 text-sm"
                    onClick={() => window.open(BOOKING_URL, "_blank")}
                  >
                    Unlock My Report <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
              )}

              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Latest Assessment
                </h2>
                {latestAssessment.assessmentDate && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} />
                    {latestAssessment.assessmentDate}
                  </span>
                )}
              </div>

              {/* Score display */}
              <div className="flex items-end gap-4 mb-6">
                <div>
                  <div className="text-6xl font-black text-white leading-none">{pct}%</div>
                  <div className={`text-base font-bold mt-2 ${bandColor}`}>{band}</div>
                </div>
                <div className="flex-1 pb-1">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, background: pillarColor(pct) }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Pillar breakdown */}
              {pillarResults && Object.keys(pillarResults).length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                    Pillar Breakdown
                  </p>
                  {Object.entries(pillarResults).map(([pillar, d]) => {
                    const p = Math.round(d.percentage);
                    return (
                      <div key={pillar}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/70">{pillar}</span>
                          <span className="font-bold">{p}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${p}%`, background: pillarColor(p) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Revenue gap */}
            {revenueGap !== null && (
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 mb-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <DollarSign size={18} className="text-gold" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Estimated monthly revenue gap</p>
                  <p className="text-2xl font-black">
                    ${revenueGap.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
              </div>
            )}

            {/* Assessment history */}
            {history && history.length > 1 && (
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp size={12} /> Assessment History
                </h3>
                <div className="space-y-0">
                  {history.map((a, i) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {a.assessmentDate ?? "—"}
                        </span>
                        {i === 0 && (
                          <span className="text-[9px] bg-gold/10 text-gold px-1.5 py-0.5 rounded font-medium uppercase">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold">{a.overallPercentage}%</span>
                        <span className="text-xs text-muted-foreground">{a.overallBand}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="bg-white/[0.03] border border-gold/20 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-black mb-2">
                {isUnlocked ? "Ready to close the gap?" : "Get your complete action plan"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {isUnlocked
                  ? "Book a strategy call to walk through your full report and build your 90-day growth roadmap."
                  : "Your Scale Detailing consultant will walk you through your full SOS results, action plan, and 90-day roadmap."}
              </p>
              <Button
                className="h-12 px-8 bg-gold text-black font-bold hover:bg-gold/90"
                onClick={() => window.open(BOOKING_URL, "_blank")}
              >
                Book a Free Strategy Call <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
