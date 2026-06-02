/**
 * CustomerPortal — Scoped view for customer-role users
 * Shows only their linked shop's assessments, reports, and progress.
 * Clean, professional, read-only experience.
 */
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  BarChart3, TrendingUp, TrendingDown, Minus, FileText,
  LogOut, Loader2, Calendar, Target, ArrowRight, Play, ChevronRight
} from 'lucide-react';
import ReportView from '@/components/ReportView';
import CalculationBoard from '@/components/CalculationBoard';
import {
  computeSOS, computeScalingProbability, getBandColor, getBandLabel,
  PILLARS, ALL_SUBCATEGORY_IDS
} from '@/lib/sos-engine';
import type { SubcategoryInput, RevenueTier, SOSResult, ScalingProbability } from '@/lib/sos-engine';

function getSeverityColor(score: number): string {
  if (score >= 80) return '#2ECC71';
  if (score >= 60) return '#D4A843';
  return '#E74C3C';
}

export default function CustomerPortal() {
  const { user, loading, logout } = useAuth();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [revenueTier, setRevenueTier] = useState<RevenueTier>('20-30');
  const [customTarget, setCustomTarget] = useState(60000);

  // Fetch shop data if user has a shopId
  const shopQuery = trpc.shops.getById.useQuery(
    { id: user?.shopId ?? 0 },
    { enabled: !!user?.shopId }
  );

  const historyQuery = trpc.shops.history.useQuery(
    { shopId: user?.shopId ?? 0 },
    { enabled: !!user?.shopId }
  );

  // Selected assessment detail
  const detailQuery = trpc.assessments.getById.useQuery(
    { id: selectedAssessmentId ?? 0 },
    { enabled: !!selectedAssessmentId }
  );

  // Fetch previous assessment for change intelligence
  const previousQuery = trpc.assessments.getPrevious.useQuery(
    { assessmentId: selectedAssessmentId ?? 0, shopId: user?.shopId ?? 0 },
    { enabled: !!selectedAssessmentId && !!user?.shopId }
  );

  // Compute results for the selected assessment
  const selectedData = useMemo(() => {
    if (!detailQuery.data) return null;
    const assessment = detailQuery.data.assessment;
    const scores = assessment.scores as Record<string, SubcategoryInput>;
    const inputs: Record<string, SubcategoryInput> = {};
    for (const id of ALL_SUBCATEGORY_IDS) {
      inputs[id] = scores[id] || { score: 0, note: '' };
    }
    const result = computeSOS(inputs);
    const tier = (assessment.revenueTier || '20-30') as RevenueTier;
    const ct = assessment.customTarget ?? 60000;
    const prob = computeScalingProbability(result, tier, tier === 'custom' ? ct : undefined);
    return { result, probability: prob, inputs, tier, customTarget: ct, shopName: detailQuery.data.shopName ?? 'Shop' };
  }, [detailQuery.data]);

  // Latest assessment for the overview
  const latestAssessment = useMemo(() => {
    if (!historyQuery.data?.length) return null;
    return historyQuery.data[0]; // Already sorted by date desc
  }, [historyQuery.data]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  // Not a customer or no shop linked
  if (!user || user.role !== 'customer' || !user.shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <BarChart3 size={48} className="text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">No Shop Linked</h2>
          <p className="text-sm text-muted-foreground">
            Your account isn't linked to a shop yet. Please contact your Scale Detailing consultant to get set up.
          </p>
          <Button onClick={() => logout()} variant="outline" className="mt-4 border-border/40">
            <LogOut size={14} className="mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // ─── Animation View ───
  if (showAnimation && selectedData) {
    return (
      <CalculationBoard
        inputs={selectedData.inputs}
        result={selectedData.result}
        probability={selectedData.probability}
        shopName={selectedData.shopName ?? 'Shop'}
        onComplete={() => setShowAnimation(false)}
      />
    );
  }

  // ─── Report View ───
  if (selectedAssessmentId && selectedData && !showAnimation) {
    const assessment = detailQuery.data?.assessment;
    return (
      <ReportView
        result={selectedData.result}
        inputs={selectedData.inputs}
        meta={{
          shopName: selectedData.shopName,
          assessorName: assessment?.assessorName ?? '',
          assessmentDate: assessment?.assessmentDate ?? '',
          notes: (assessment?.notes as string) ?? '',
        }}
        probability={selectedData.probability}
        onBack={() => setSelectedAssessmentId(null)}
        isCustomerView={true}
        revenueTier={revenueTier}
        onTierChange={(tier, ct) => {
          setRevenueTier(tier);
          if (ct !== undefined) setCustomTarget(ct);
        }}
        customerLogoUrl={shopQuery.data?.logoUrl ?? undefined}
        businessProfile={(assessment?.businessProfile as import('@shared/business-profile').BusinessProfile) ?? null}
        isReassessment={!!previousQuery.data}
        previousInputs={previousQuery.data ? Object.fromEntries(
          Object.entries(previousQuery.data.scores || {}).map(([id, s]: [string, any]) => [id, { score: s?.score ?? 0, note: s?.note ?? '' }])
        ) : null}
        previousDate={previousQuery.data?.assessmentDate || null}
        previousRevenue={null}
        previousBusinessProfile={null}
      />
    );
  }

  // ─── Main Portal View ───
  const assessments = historyQuery.data || [];
  const shop = shopQuery.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <Link href="/">
              {shop?.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} className="h-7 w-7 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity" />
              ) : (
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
                  alt="Scale Detailing"
                  className="h-7 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                />
              )}
            </Link>
            <div className="h-5 w-px bg-border/40 hidden sm:block" />
            <span className="hidden sm:inline text-sm font-bold tracking-wider text-foreground">
              {shop?.name ?? 'My Shop'} <span className="text-gold font-normal text-xs">Portal</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {user.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 sm:py-8 space-y-6">
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="glass-card p-5 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
              Welcome back, <span className="text-gold">{user.name || 'there'}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Here's your business health overview for <span className="font-semibold text-foreground">{shop?.name}</span>.
              {assessments.length > 0 && ` You have ${assessments.length} assessment${assessments.length > 1 ? 's' : ''} on record.`}
            </p>
          </div>
        </motion.div>

        {/* Latest Score Overview */}
        {latestAssessment && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-gold" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Latest Assessment</h2>
                <span className="text-[10px] text-muted-foreground/40 ml-auto font-mono">
                  {new Date(latestAssessment.assessmentDate).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="rounded-lg border border-border/20 bg-muted/10 p-3 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1">Overall Score</p>
                  <p className="font-data text-2xl font-bold" style={{ color: getSeverityColor(latestAssessment.overallPercentage) }}>
                    {latestAssessment.overallPercentage.toFixed(0)}%
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: getSeverityColor(latestAssessment.overallPercentage) }}>
                    {latestAssessment.overallPercentage >= 80 ? 'Healthy' : latestAssessment.overallPercentage >= 60 ? 'Needs Attention' : 'Critical'}
                  </p>
                </div>
                <div className="rounded-lg border border-border/20 bg-muted/10 p-3 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1">Scaling Probability</p>
                  <p className="font-data text-2xl font-bold text-gold">
                    {latestAssessment.scalingProbability.toFixed(0)}%
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {latestAssessment.revenueTier === 'custom' ? 'Custom' : `$${latestAssessment.revenueTier.replace('-', 'k–$')}k/mo`}
                  </p>
                </div>
                <div className="rounded-lg border border-border/20 bg-muted/10 p-3 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1">Assessments</p>
                  <p className="font-data text-2xl font-bold text-foreground">{assessments.length}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Total on record</p>
                </div>
                <div className="rounded-lg border border-border/20 bg-muted/10 p-3 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1">Trend</p>
                  {assessments.length >= 2 ? (
                    <>
                      {(() => {
                        const prev = assessments[1];
                        const delta = latestAssessment.overallPercentage - prev.overallPercentage;
                        return (
                          <>
                            <div className="flex items-center justify-center gap-1">
                              {delta > 0 ? <TrendingUp size={18} className="text-green-400" /> : delta < 0 ? <TrendingDown size={18} className="text-red-400" /> : <Minus size={18} className="text-muted-foreground" />}
                              <p className="font-data text-2xl font-bold" style={{ color: delta > 0 ? '#2ECC71' : delta < 0 ? '#E74C3C' : '#888' }}>
                                {delta > 0 ? '+' : ''}{delta.toFixed(0)}
                              </p>
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-0.5">pts since last</p>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      <p className="font-data text-lg font-bold text-muted-foreground/40">—</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">Need 2+ assessments</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setSelectedAssessmentId(latestAssessment.id)}
                  className="h-9 px-4 text-xs gap-2 bg-gold text-black hover:bg-gold-light flex-1 sm:flex-none"
                >
                  <FileText size={14} />
                  View Full Report
                </Button>
                <Button
                  onClick={() => {
                    setSelectedAssessmentId(latestAssessment.id);
                    setShowAnimation(true);
                  }}
                  variant="outline"
                  className="h-9 px-4 text-xs gap-2 border-gold/40 text-gold hover:bg-gold/10 flex-1 sm:flex-none"
                >
                  <Play size={14} />
                  Watch Analysis
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Assessment History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-gold" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Assessment History</h2>
              <span className="text-[10px] font-data text-muted-foreground/40 ml-auto">{assessments.length} records</span>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 size={32} className="text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No assessments yet. Your consultant will perform the first one soon.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assessments.map((a: any, i: number) => {
                  const isLatest = i === 0;
                  const prevAssessment = assessments[i + 1];
                  const delta = prevAssessment ? a.overallPercentage - prevAssessment.overallPercentage : null;

                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAssessmentId(a.id)}
                      className={`w-full rounded-lg border px-4 py-3 flex items-center gap-3 transition-all text-left hover:border-gold/30 hover:bg-gold/5 ${
                        isLatest ? 'border-gold/20 bg-gold/5' : 'border-border/20 bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-data text-muted-foreground">
                            {new Date(a.assessmentDate).toLocaleDateString()}
                          </span>
                          {isLatest && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-gold/10 text-gold">
                              Latest
                            </span>
                          )}
                          {a.assessorName && (
                            <span className="text-[10px] text-muted-foreground/40">by {a.assessorName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-data text-sm font-bold" style={{ color: getSeverityColor(a.overallPercentage) }}>
                            {a.overallPercentage.toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Prob: <span className="font-data text-gold">{a.scalingProbability.toFixed(0)}%</span>
                          </span>
                          {delta !== null && (
                            <span className={`text-[10px] font-mono ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                              {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {delta > 0 ? '+' : ''}{delta.toFixed(0)} pts
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground/30" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-[10px] text-muted-foreground/30 uppercase tracking-widest">
            Scale Toolkit · Powered by Scale Detailing
          </p>
        </div>
      </main>
    </div>
  );
}
