/*
 * ReassessmentComparison — Rich before/after visualization panel
 * Shows when viewing a reassessment: pillar deltas, probability trajectory,
 * time context, and subcategory-level changes with severity labels.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown,
  Clock, Shield, BarChart3, Activity, Layers, Target, Zap, ArrowRight,
} from 'lucide-react';
import { getBandColor, getBandLabel, getProbabilityColor, PILLARS } from '@/lib/sos-engine';
import type { SOSResult } from '@/lib/sos-engine';

interface PreviousAssessmentData {
  id: number;
  assessmentDate: string;
  overallPercentage: number;
  overallBand: string;
  scalingProbability: number;
  revenueTier: string;
  scores: Record<string, { score: number; note: string }>;
  pillarResults: any[];
}

interface ReassessmentComparisonProps {
  current: {
    result: SOSResult;
    probability: number;
    date: string;
  };
  previous: PreviousAssessmentData;
}

const SCORE_LABELS: Record<number, string> = {
  0: 'Non-existent', 1: 'Poor', 2: 'Below Avg', 3: 'Average', 4: 'Good', 5: 'Elite',
};

const PILLAR_ICONS = [Shield, BarChart3, Activity, Layers];

function getDaysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function DeltaBadge({ delta, suffix = '' }: { delta: number; suffix?: string }) {
  if (delta === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold text-muted-foreground/50">
      <Minus size={10} /> No change
    </span>
  );
  const isPositive = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-data font-bold ${isPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {isPositive ? '+' : ''}{delta.toFixed(1)}{suffix}
    </span>
  );
}

export default function ReassessmentComparison({ current, previous }: ReassessmentComparisonProps) {
  const daysBetween = useMemo(() => getDaysBetween(previous.assessmentDate, current.date), [previous, current]);
  const overallDelta = current.result.percentage - previous.overallPercentage;
  const probDelta = current.probability - previous.scalingProbability;
  const ratePerDay = daysBetween > 0 ? overallDelta / daysBetween : 0;

  // Pillar deltas
  const pillarDeltas = useMemo(() => {
    return current.result.pillars.map((cp, i) => {
      const pp = previous.pillarResults.find((p: any) => p.id === cp.id);
      return {
        id: cp.id,
        label: cp.label,
        currentPct: cp.percentage,
        previousPct: pp?.percentage ?? 0,
        delta: cp.percentage - (pp?.percentage ?? 0),
        currentBand: cp.band,
        previousBand: pp?.band ?? 'red',
        icon: PILLAR_ICONS[i] || Shield,
      };
    });
  }, [current, previous]);

  // Subcategory changes — top improvements and regressions
  const subcategoryChanges = useMemo(() => {
    const changes: { id: string; label: string; pillarLabel: string; prevScore: number; newScore: number; delta: number }[] = [];
    for (const pillar of PILLARS) {
      for (const sub of pillar.subcategories) {
        const prevScore = previous.scores[sub.id]?.score ?? 0;
        const newScore = current.result.pillars
          .find(p => p.id === pillar.id)?.subcategories
          .find(s => s.id === sub.id)?.score ?? 0;
        if (prevScore !== newScore) {
          changes.push({
            id: sub.id,
            label: sub.label,
            pillarLabel: pillar.label,
            prevScore,
            newScore,
            delta: newScore - prevScore,
          });
        }
      }
    }
    return {
      improved: changes.filter(c => c.delta > 0).sort((a, b) => b.delta - a.delta),
      regressed: changes.filter(c => c.delta < 0).sort((a, b) => a.delta - b.delta),
      unchanged: PILLARS.flatMap(p => p.subcategories).length - changes.length,
    };
  }, [current, previous]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border-2 border-gold/20 bg-gradient-to-b from-gold/[0.03] to-transparent overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-gold/10 bg-gold/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <TrendingUp size={18} className="text-gold" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-[0.06em]">
              Progress Since Last Assessment
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock size={10} className="text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {daysBetween} days · {previous.assessmentDate} → {current.date}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="font-data text-lg font-bold" style={{ color: overallDelta >= 0 ? '#2ECC71' : '#E74C3C' }}>
                {overallDelta >= 0 ? '+' : ''}{overallDelta.toFixed(1)}%
              </span>
              {overallDelta >= 0 ? <ArrowUpRight size={16} className="text-[#2ECC71]" /> : <ArrowDownRight size={16} className="text-[#E74C3C]" />}
            </div>
            <p className="text-[9px] text-muted-foreground/40 font-mono">overall change</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Overall Score',
              prev: `${previous.overallPercentage.toFixed(0)}%`,
              curr: `${current.result.percentage.toFixed(0)}%`,
              delta: overallDelta,
              suffix: '%',
              color: getBandColor(current.result.band),
            },
            {
              label: 'Scaling Probability',
              prev: `${previous.scalingProbability.toFixed(0)}%`,
              curr: `${current.probability.toFixed(0)}%`,
              delta: probDelta,
              suffix: '%',
              color: getProbabilityColor(current.probability),
            },
            {
              label: 'Improvement Rate',
              prev: '',
              curr: ratePerDay > 0 ? `+${(ratePerDay * 30).toFixed(1)}%/mo` : ratePerDay < 0 ? `${(ratePerDay * 30).toFixed(1)}%/mo` : 'Stable',
              delta: ratePerDay * 30,
              suffix: '',
              color: ratePerDay >= 0 ? '#2ECC71' : '#E74C3C',
            },
            {
              label: 'Areas Changed',
              prev: '',
              curr: `${subcategoryChanges.improved.length + subcategoryChanges.regressed.length} of 30`,
              delta: subcategoryChanges.improved.length - subcategoryChanges.regressed.length,
              suffix: ' net',
              color: '#C8962E',
            },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-xl border border-border/15 bg-card p-3 relative overflow-hidden"
            >
              <p className="font-data text-[8px] uppercase tracking-[0.1em] text-muted-foreground/40 mb-2">{metric.label}</p>
              {metric.prev && (
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-muted-foreground/40 font-mono">{metric.prev}</span>
                  <ArrowRight size={8} className="text-gold/30" />
                  <span className="text-sm font-bold font-mono" style={{ color: metric.color }}>{metric.curr}</span>
                </div>
              )}
              {!metric.prev && (
                <p className="text-sm font-bold font-mono" style={{ color: metric.color }}>{metric.curr}</p>
              )}
              <DeltaBadge delta={metric.delta} suffix={metric.suffix} />
            </motion.div>
          ))}
        </div>

        {/* Pillar-Level Comparison */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 mb-3">Pillar Progress</h3>
          <div className="space-y-2">
            {pillarDeltas.map((pd, i) => {
              const Icon = pd.icon;
              const prevColor = getBandColor(pd.previousBand);
              const currColor = getBandColor(pd.currentBand);
              return (
                <motion.div
                  key={pd.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="rounded-lg border border-border/15 bg-card/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${currColor}12` }}>
                      <Icon size={14} style={{ color: currColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-foreground">{pd.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${prevColor}15`, color: prevColor }}>
                            {getBandLabel(pd.previousBand)} {pd.previousPct.toFixed(0)}%
                          </span>
                          <ArrowRight size={10} className="text-gold/30" />
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${currColor}15`, color: currColor }}>
                            {getBandLabel(pd.currentBand)} {pd.currentPct.toFixed(0)}%
                          </span>
                        </div>
                        <DeltaBadge delta={pd.delta} suffix="%" />
                      </div>
                      {/* Double progress bar */}
                      <div className="relative h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        {/* Previous (faded) */}
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full opacity-25"
                          style={{ backgroundColor: prevColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pd.previousPct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                        />
                        {/* Current (solid) */}
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ backgroundColor: currColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pd.currentPct}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Subcategory Changes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Improvements */}
          {subcategoryChanges.improved.length > 0 && (
            <div className="rounded-xl border border-[#2ECC71]/15 bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                  <TrendingUp size={13} className="text-[#2ECC71]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Improvements</h4>
                  <p className="text-[8px] text-muted-foreground/40">{subcategoryChanges.improved.length} areas improved</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {subcategoryChanges.improved.slice(0, 8).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg bg-[#2ECC71]/[0.03] border border-[#2ECC71]/8 px-2.5 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-foreground truncate">{c.label}</p>
                      <p className="text-[8px] text-muted-foreground/40 font-mono">{c.pillarLabel}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-data text-muted-foreground/40">{SCORE_LABELS[c.prevScore]}</span>
                      <ArrowRight size={8} className="text-[#2ECC71]/40" />
                      <span className="text-[10px] font-data font-bold text-[#2ECC71]">{SCORE_LABELS[c.newScore]}</span>
                      <span className="text-[9px] font-data font-bold text-[#2ECC71]">+{c.delta}</span>
                    </div>
                  </div>
                ))}
                {subcategoryChanges.improved.length > 8 && (
                  <p className="text-[9px] text-muted-foreground/40 text-center pt-1">
                    +{subcategoryChanges.improved.length - 8} more improvements
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Regressions */}
          {subcategoryChanges.regressed.length > 0 && (
            <div className="rounded-xl border border-[#E74C3C]/15 bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#E74C3C]/10 flex items-center justify-center">
                  <TrendingDown size={13} className="text-[#E74C3C]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Regressions</h4>
                  <p className="text-[8px] text-muted-foreground/40">{subcategoryChanges.regressed.length} areas declined</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {subcategoryChanges.regressed.slice(0, 8).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg bg-[#E74C3C]/[0.03] border border-[#E74C3C]/8 px-2.5 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-foreground truncate">{c.label}</p>
                      <p className="text-[8px] text-muted-foreground/40 font-mono">{c.pillarLabel}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-data text-muted-foreground/40">{SCORE_LABELS[c.prevScore]}</span>
                      <ArrowRight size={8} className="text-[#E74C3C]/40" />
                      <span className="text-[10px] font-data font-bold text-[#E74C3C]">{SCORE_LABELS[c.newScore]}</span>
                      <span className="text-[9px] font-data font-bold text-[#E74C3C]">{c.delta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No changes message */}
          {subcategoryChanges.improved.length === 0 && subcategoryChanges.regressed.length === 0 && (
            <div className="col-span-full rounded-xl border border-border/15 bg-card p-6 text-center">
              <Minus size={24} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground/50">No subcategory score changes detected between assessments.</p>
            </div>
          )}
        </div>

        {/* Summary insight */}
        <div className="rounded-xl border border-gold/12 bg-gold/[0.02] p-4">
          <div className="flex items-start gap-2">
            <Zap size={14} className="text-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {overallDelta > 5 && (
                  <>Strong progress. The overall score improved by <strong className="text-[#2ECC71]">{overallDelta.toFixed(1)} points</strong> in {daysBetween} days, with {subcategoryChanges.improved.length} areas showing improvement. {probDelta > 0 ? `Scaling probability increased by ${probDelta.toFixed(1)} points.` : ''}</>
                )}
                {overallDelta > 0 && overallDelta <= 5 && (
                  <>Modest improvement. The overall score moved up <strong className="text-[#2ECC71]">{overallDelta.toFixed(1)} points</strong>. {subcategoryChanges.improved.length > 0 ? `${subcategoryChanges.improved.length} areas improved` : 'Focus on the Growth Protocol recommendations for faster gains'}. {subcategoryChanges.regressed.length > 0 ? `Watch the ${subcategoryChanges.regressed.length} area${subcategoryChanges.regressed.length > 1 ? 's' : ''} that regressed.` : ''}</>
                )}
                {overallDelta === 0 && (
                  <>Score held steady at <strong>{current.result.percentage.toFixed(0)}%</strong>. While stability isn't bad, focus on the Growth Protocol to push forward.</>
                )}
                {overallDelta < 0 && (
                  <>The overall score declined by <strong className="text-[#E74C3C]">{Math.abs(overallDelta).toFixed(1)} points</strong>. {subcategoryChanges.regressed.length} areas regressed. Review the regressions above and prioritize recovery in those areas before pursuing new improvements.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
