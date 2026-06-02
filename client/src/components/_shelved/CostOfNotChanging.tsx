/**
 * CostOfNotChanging v2 — Financial Impact of Inaction
 * 
 * Grounded in REAL numbers: current revenue, goal revenue, and the gap between them.
 * Two narratives:
 * 1. "If you do nothing, here's what you lose" (erosion + missed opportunity)
 * 2. "If you implement, here's what you gain" (quick wins + full potential)
 *
 * Design: Red/warning gradient, big numbers, urgency-driven layout
 */
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, DollarSign, ArrowRight, Flame, Clock, Zap, Target, ArrowDown } from 'lucide-react';
import type { CostOfNotChanging as CostData, TrajectoryData } from '@/lib/cost-engine';
import { getSeverityColor, formatCurrency } from '@/lib/cost-engine';
import GrowthTrajectoryChart from './GrowthTrajectoryChart';

interface CostOfNotChangingProps {
  cost: CostData;
  trajectory?: TrajectoryData;
  animateIn?: boolean;
  isCustomerView?: boolean;
}

export default function CostOfNotChanging({ cost, trajectory, animateIn = true, isCustomerView = false }: CostOfNotChangingProps) {
  const severityColor = getSeverityColor(cost.severity);
  
  const gradientClass = cost.severity === 'critical'
    ? 'from-red-950/40 via-red-900/20 to-transparent'
    : cost.severity === 'significant'
    ? 'from-orange-950/30 via-orange-900/15 to-transparent'
    : cost.severity === 'moderate'
    ? 'from-yellow-950/20 via-yellow-900/10 to-transparent'
    : 'from-green-950/15 via-green-900/8 to-transparent';

  const borderColor = cost.severity === 'critical'
    ? 'border-red-500/30'
    : cost.severity === 'significant'
    ? 'border-orange-500/25'
    : cost.severity === 'moderate'
    ? 'border-yellow-500/20'
    : 'border-green-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={animateIn ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.32 }}
      className={`rounded-2xl border-2 ${borderColor} bg-card overflow-hidden print:break-inside-avoid`}
    >
      {/* Header */}
      <div className={`px-6 sm:px-8 py-5 bg-gradient-to-r ${gradientClass} border-b ${borderColor}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${severityColor}15` }}>
            <AlertTriangle size={22} style={{ color: severityColor }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-[0.06em]">
                Cost of Not Changing
              </h2>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${severityColor}15`, color: severityColor }}
              >
                {cost.severityLabel}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">
              Financial impact analysis · {cost.isRealData ? 'Based on actual revenue data' : `${cost.tierLabel} target · Estimated`}
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="font-data text-2xl font-bold" style={{ color: severityColor }}>
              {formatCurrency(cost.monthlyGap)}
            </p>
            <p className="text-[9px] text-muted-foreground/40 font-mono">monthly gap</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Insight callout */}
        <div className="rounded-lg border border-border/10 bg-white/[0.02] px-4 py-3">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            <strong className="text-foreground/80">What this means:</strong>{' '}
            {cost.isRealData ? (
              <>
                You're currently at <strong className="font-data text-foreground">{formatCurrency(cost.currentRevenue)}/mo</strong> and
                want to reach <strong className="font-data text-[#2ECC71]">{formatCurrency(cost.goalRevenue)}/mo</strong>.
                That's a <strong className="font-mono" style={{ color: severityColor }}>{formatCurrency(cost.monthlyGap)}/mo</strong> gap.
                {' '}Based on your current scores, you have a <strong className="font-data text-gold">{cost.probabilityOfSuccess.toFixed(0)}%</strong> chance
                of closing that gap. If you do nothing, market erosion alone could cost you
                an additional <strong className="font-mono" style={{ color: severityColor }}>{formatCurrency(cost.inactionMonthlyDecline)}/mo</strong> in declining revenue.
              </>
            ) : (
              <>
                Based on your scores and revenue tier, your operational gaps are costing an estimated
                <strong className="font-mono" style={{ color: severityColor }}> {formatCurrency(cost.monthlyGap)}/mo</strong> in unrealized revenue.
                {cost.quickWinMonthly > 0 && (
                  <> Fixing just the top 3 priorities could recover <strong className="font-data text-[#2ECC71]">{formatCurrency(cost.quickWinMonthly)}/mo</strong>.</>
                )}
              </>
            )}
          </p>
        </div>

        {/* Revenue Reality — Current → Goal with gap */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Current Revenue */}
          <div className="rounded-xl border border-border/15 bg-white/[0.02] p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: `${severityColor}30` }} />
            <DollarSign size={14} className="mx-auto mb-1.5 text-muted-foreground/30" />
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-1">
              {cost.isRealData ? 'Current Revenue' : 'Estimated Current'}
            </p>
            <p className="font-data text-xl font-bold text-foreground">{formatCurrency(cost.currentRevenue)}</p>
            <p className="text-[9px] text-muted-foreground/40 mt-0.5">per month</p>
          </div>

          {/* Arrow + Gap */}
          <div className="hidden sm:flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <ArrowRight size={20} style={{ color: severityColor }} />
              <p className="font-data text-sm font-bold" style={{ color: severityColor }}>
                +{formatCurrency(cost.monthlyGap)}
              </p>
              <p className="text-[8px] text-muted-foreground/30">monthly gap</p>
            </div>
          </div>

          {/* Goal Revenue */}
          <div className="rounded-xl border border-[#2ECC71]/15 bg-[#2ECC71]/[0.03] p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#2ECC71]/30" />
            <Target size={14} className="mx-auto mb-1.5 text-[#2ECC71]/40" />
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-1">
              {cost.isRealData ? 'Goal Revenue' : 'Tier Target'}
            </p>
            <p className="font-data text-xl font-bold text-[#2ECC71]">{formatCurrency(cost.goalRevenue)}</p>
            <p className="text-[9px] text-muted-foreground/40 mt-0.5">per month</p>
          </div>
        </div>

        {/* Mobile gap indicator */}
        <div className="sm:hidden rounded-lg border border-border/15 bg-white/[0.02] p-3 text-center">
          <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-1">Monthly Revenue Gap</p>
          <p className="font-data text-2xl font-bold" style={{ color: severityColor }}>{formatCurrency(cost.monthlyGap)}</p>
        </div>

        {/* Growth Trajectory Chart */}
        {trajectory && (
          <GrowthTrajectoryChart
            trajectory={trajectory}
            animateIn={animateIn}
            isCustomerView={isCustomerView}
          />
        )}

        {/* Two-Track Projection: Inaction vs Opportunity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Track 1: Cost of Doing Nothing (Erosion) */}
          <div className="rounded-xl border border-red-500/15 bg-red-950/[0.03] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ArrowDown size={14} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">If You Do Nothing</h3>
                <p className="text-[8px] text-muted-foreground/40">Revenue erosion from inaction</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                <span className="text-[9px] text-muted-foreground/50">Monthly decline</span>
                <span className="font-data text-xs font-bold text-red-400">-{formatCurrency(cost.inactionMonthlyDecline)}/mo</span>
              </div>
              {[
                { label: '3 Months', amount: cost.inaction3Month },
                { label: '6 Months', amount: cost.inaction6Month },
                { label: '12 Months', amount: cost.inaction12Month },
              ].map((proj, i) => (
                <div key={proj.label} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                  <span className="text-[9px] text-muted-foreground/50">{proj.label} total cost</span>
                  <span
                    className="font-data text-xs font-bold"
                    style={{ color: i === 2 ? '#E74C3C' : i === 1 ? '#E74C3CCC' : '#E74C3C99' }}
                  >
                    -{formatCurrency(proj.amount)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground/40 mt-2 italic">
              Includes market erosion + missed goal revenue
            </p>
          </div>

          {/* Track 2: Opportunity Cost (Gap × Time) */}
          <div className="rounded-xl border border-gold/15 bg-gold/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                <Clock size={14} className="text-gold" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Revenue Left on the Table</h3>
                <p className="text-[8px] text-muted-foreground/40">Opportunity cost of not reaching goal</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                <span className="text-[9px] text-muted-foreground/50">Monthly gap</span>
                <span className="font-data text-xs font-bold text-gold">{formatCurrency(cost.monthlyGap)}/mo</span>
              </div>
              {[
                { label: '3 Months', amount: cost.opportunityCost3Month },
                { label: '6 Months', amount: cost.opportunityCost6Month },
                { label: '12 Months', amount: cost.opportunityCost12Month },
              ].map((proj, i) => (
                <motion.div
                  key={proj.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={animateIn ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
                  style={i === 2 ? { borderLeft: `2px solid ${severityColor}40` } : {}}
                >
                  <span className="text-[9px] text-muted-foreground/50">{proj.label}</span>
                  <span
                    className="font-data text-xs font-bold"
                    style={{ color: i === 2 ? severityColor : i === 1 ? `${severityColor}CC` : `${severityColor}99` }}
                  >
                    {formatCurrency(proj.amount)}
                  </span>
                </motion.div>
              ))}
            </div>
            {cost.isRealData && (
              <div className="mt-2 rounded-lg bg-gold/[0.05] px-3 py-2">
                <p className="text-[9px] text-muted-foreground/50">
                  Expected revenue at current scores:{' '}
                  <span className="font-data font-bold text-foreground">{formatCurrency(cost.expectedRevenueAtCurrentScores)}/mo</span>
                  {' '}({cost.probabilityOfSuccess.toFixed(0)}% of goal)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* The Big Scary Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={animateIn ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="rounded-xl border-2 p-5 text-center relative overflow-hidden"
          style={{ borderColor: `${severityColor}30` }}
        >
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundColor: severityColor }} />
          <Flame size={18} className="mx-auto mb-2" style={{ color: severityColor }} />
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1">
            12-Month Cost of Inaction
          </p>
          <p className="font-data text-3xl sm:text-4xl font-bold" style={{ color: severityColor }}>
            {formatCurrency(cost.inaction12Month)}
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            Combined erosion + missed revenue over the next year
          </p>
        </motion.div>

        {/* Per-Pillar Breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={12} className="text-muted-foreground/30" />
            <span className="font-data text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">
              Where You're Losing Revenue
            </span>
          </div>
          <div className="space-y-2">
            {cost.pillarBreakdowns
              .sort((a, b) => b.potentialGain - a.potentialGain)
              .map((pillar, i) => {
                const barWidth = Math.max(5, (pillar.potentialGain / Math.max(1, cost.monthlyGap)) * 100);
                return (
                  <motion.div
                    key={pillar.pillarId}
                    initial={{ opacity: 0, x: -15 }}
                    animate={animateIn ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="rounded-lg border border-border/10 bg-muted/[0.03] p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{pillar.pillarLabel}</span>
                        <span className="text-[8px] text-muted-foreground/30 font-mono">
                          {pillar.currentScore.toFixed(0)}% current
                        </span>
                      </div>
                      <span className="font-data text-sm font-bold" style={{ color: severityColor }}>
                        +{formatCurrency(pillar.potentialGain)}/mo
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/10 overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={animateIn ? { width: `${barWidth}%` } : {}}
                        transition={{ delay: 0.7 + i * 0.08, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: `${severityColor}60` }}
                      />
                    </div>
                    {pillar.topSubcategory !== 'N/A' && (
                      <p className="text-[10px] text-muted-foreground/50">
                        <Zap size={9} className="inline text-gold/50 mr-0.5" />
                        Quick win: Fix <span className="font-semibold text-foreground/60">{pillar.topSubcategory}</span>
                        {pillar.topSubcategoryGain > 0 && (
                          <> → recover <span className="font-data font-bold text-[#2ECC71]">~{formatCurrency(pillar.topSubcategoryGain)}/mo</span></>
                        )}
                      </p>
                    )}
                  </motion.div>
                );
              })}
          </div>
        </div>

        {/* Quick Win Recovery */}
        {cost.quickWinMonthly > 0 && (
          <div className="rounded-xl border-2 border-[#2ECC71]/20 bg-[#2ECC71]/[0.03] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                <Zap size={16} className="text-[#2ECC71]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Quick-Win Recovery</h3>
                <p className="text-[9px] text-muted-foreground/40">Fix the top 3 priorities from the Growth Protocol</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">Monthly Recovery</p>
                <p className="font-data text-lg font-bold text-[#2ECC71]">+{formatCurrency(cost.quickWinMonthly)}</p>
              </div>
              <ArrowRight size={14} className="text-[#2ECC71]/30" />
              <div>
                <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">Annual Impact</p>
                <p className="font-data text-lg font-bold text-[#2ECC71]">+{formatCurrency(cost.quickWinAnnual)}</p>
              </div>
            </div>
            {!isCustomerView && (
              <p className="text-[10px] text-muted-foreground/50 mt-3 italic">
                {cost.isRealData
                  ? 'Based on your actual revenue numbers and probability model. Results depend on implementation quality.'
                  : 'Based on estimated revenue from tier selection. Enter actual revenue numbers for more accurate projections.'}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
