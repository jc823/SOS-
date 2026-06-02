/**
 * BattlePlan — 30-Day Battle Plan display component
 * Shows a week-by-week tactical action plan with specific tasks
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Target, Zap, Settings, TrendingUp, ChevronDown, ChevronUp,
  Calendar, CheckCircle2, Loader2, Flame, BarChart3, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import type { SubcategoryInput } from '@/lib/sos-engine';
import type { BusinessProfile } from '@shared/business-profile';

interface BattlePlanProps {
  inputs: Record<string, SubcategoryInput>;
  overallPercentage: number;
  scalingProbability: number;
  shopName: string;
  revenueTier: string;
  currentRevenue?: number;
  goalRevenue?: number;
  businessProfile?: BusinessProfile | null;
  assessmentId?: number;
  /** Pre-loaded battle plan from saved assessment */
  existingPlan?: any;
}

const WEEK_ICONS = [Zap, Settings, TrendingUp, BarChart3];
const WEEK_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];

export default function BattlePlan({
  inputs, overallPercentage, scalingProbability, shopName, revenueTier,
  currentRevenue, goalRevenue, businessProfile, assessmentId, existingPlan,
}: BattlePlanProps) {
  const [plan, setPlan] = useState<any>(existingPlan || null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));

  const generateMutation = trpc.actionPlan.generateBattlePlan.useMutation({
    onSuccess: (data) => setPlan(data),
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      scores: inputs,
      overallPercentage,
      scalingProbability,
      shopName,
      revenueTier,
      currentRevenue,
      goalRevenue,
      businessProfile: businessProfile || undefined,
      assessmentId,
    });
  };

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      return next;
    });
  };

  // Not generated yet — show CTA
  if (!plan || !plan.weeks?.length) {
    return (
      <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Swords size={20} className="text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">30-Day Battle Plan</h3>
            <p className="text-xs text-muted-foreground">AI-powered tactical action plan with weekly milestones</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Generate a week-by-week battle plan with specific daily tasks, expected revenue impact, and measurable milestones.
          Tailored to this shop's exact scores and weaknesses.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="h-11 px-6 gap-2 bg-gold text-black hover:bg-gold/90 font-semibold"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating Battle Plan...
            </>
          ) : (
            <>
              <Swords size={16} />
              Generate 30-Day Battle Plan
            </>
          )}
        </Button>
        {generateMutation.isError && (
          <p className="text-xs text-red-400 mt-2">Failed to generate. Please try again.</p>
        )}
      </div>
    );
  }

  // Plan generated — show full battle plan
  return (
    <div className="rounded-2xl border border-gold/20 bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-transparent p-6 sm:p-8 border-b border-white/[0.06]">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
            <Swords size={20} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground">
              {plan.battlePlanTitle || '30-Day Battle Plan'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{plan.executiveSummary}</p>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl border border-gold/15 bg-gold/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-gold" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Expected Impact</span>
            </div>
            <p className="text-sm font-bold text-gold">{plan.expectedRevenueImpact || 'Significant'}</p>
          </div>
          <div className="rounded-xl border border-border/20 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-blue-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">30-Day Target</span>
            </div>
            <p className="text-sm font-medium text-foreground/80 line-clamp-2">{plan.thirtyDayTarget || 'See weekly milestones'}</p>
          </div>
          <div className="rounded-xl border border-border/20 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Key Metrics</span>
            </div>
            <p className="text-xs text-foreground/70 line-clamp-2">
              {plan.keyMetricsToTrack?.slice(0, 3).join(' · ') || 'Revenue, Leads, Close Rate'}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly breakdown */}
      <div className="p-4 sm:p-6 space-y-3">
        {(plan.weeks || []).map((week: any, idx: number) => {
          const WeekIcon = WEEK_ICONS[idx] || Calendar;
          const weekColor = WEEK_COLORS[idx] || '#C8962E';
          const isExpanded = expandedWeeks.has(week.weekNumber || idx + 1);

          return (
            <div key={idx} className="rounded-xl border overflow-hidden" style={{ borderColor: `${weekColor}20` }}>
              {/* Week header */}
              <button
                onClick={() => toggleWeek(week.weekNumber || idx + 1)}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${weekColor}15` }}>
                  <WeekIcon size={16} style={{ color: weekColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Week {week.weekNumber || idx + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${weekColor}15`, color: weekColor }}>
                      {week.theme}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{week.goal}</p>
                </div>
                <div className="text-muted-foreground">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Week tasks */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2.5">
                      {(week.tasks || []).map((task: any, tIdx: number) => (
                        <div key={tIdx} className="rounded-lg border border-border/15 bg-white/[0.02] p-3.5">
                          <div className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${weekColor}10` }}>
                              <Clock size={10} style={{ color: weekColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground">
                                  {task.day}
                                </span>
                                <span className="text-sm font-semibold text-foreground">{task.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
                              {task.expectedImpact && (
                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/10">
                                  <Flame size={10} className="text-gold shrink-0" />
                                  <span className="text-[10px] text-gold/80 font-medium">{task.expectedImpact}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Weekly milestone */}
                      {week.weeklyMilestone && (
                        <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                          <CheckCircle2 size={14} style={{ color: weekColor }} />
                          <span className="text-xs font-medium text-foreground/70">
                            <span className="text-muted-foreground">Milestone:</span> {week.weeklyMilestone}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Regenerate button */}
      <div className="px-6 pb-6 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="h-8 text-xs gap-1.5 border-gold/20 text-gold hover:bg-gold/10"
        >
          {generateMutation.isPending ? (
            <><Loader2 size={12} className="animate-spin" /> Regenerating...</>
          ) : (
            <><Swords size={12} /> Regenerate Plan</>
          )}
        </Button>
      </div>
    </div>
  );
}
