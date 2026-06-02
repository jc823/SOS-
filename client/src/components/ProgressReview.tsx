/**
 * ProgressReview — Displays the change intelligence report
 * Used in both internal ReportView and customer-facing reports during reassessments.
 * Shows: progress grade, score deltas, pillar comparison, bottleneck analysis,
 * revenue comparison, business profile changes, and time-to-goal projection.
 */
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Award, Clock, Target,
  ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, AlertTriangle,
  BarChart3, DollarSign, Users, Zap, Shield,
} from 'lucide-react';
import type { ChangeIntelligenceReport, ProgressGrade } from '@/lib/change-intelligence';

interface ProgressReviewProps {
  report: ChangeIntelligenceReport;
  isCustomerView?: boolean;
}

// ─── Grade Colors ───
function getGradeColor(grade: ProgressGrade): string {
  switch (grade) {
    case 'A+': case 'A': return '#10B981';
    case 'B+': case 'B': return '#C8962E';
    case 'C+': case 'C': return '#F59E0B';
    case 'D': return '#EF4444';
    case 'F': return '#DC2626';
  }
}

function getGradeEmoji(grade: ProgressGrade): string {
  switch (grade) {
    case 'A+': return '🏆';
    case 'A': return '⭐';
    case 'B+': case 'B': return '📈';
    case 'C+': case 'C': return '➡️';
    case 'D': return '⚠️';
    case 'F': return '🚨';
  }
}

// ─── Delta Arrow ───
function DeltaDisplay({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400 font-data text-sm font-bold">
        <ArrowUpRight size={14} />
        {prefix}+{Math.abs(value).toFixed(1)}{suffix}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-400 font-data text-sm font-bold">
        <ArrowDownRight size={14} />
        {prefix}{value.toFixed(1)}{suffix}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground font-data text-sm">
      <Minus size={14} /> No change
    </span>
  );
}

export default function ProgressReview({ report, isCustomerView = false }: ProgressReviewProps) {
  const gradeColor = getGradeColor(report.progressGrade);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${gradeColor}15` }}>
          <TrendingUp size={20} style={{ color: gradeColor }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Progress Review</h3>
          <p className="text-xs text-muted-foreground">
            Comparing assessment from {new Date(report.previousDate).toLocaleDateString()} to {new Date(report.currentDate).toLocaleDateString()} ({report.daysBetween} days)
          </p>
        </div>
      </div>

      {/* Progress Grade Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border-2 p-5 relative overflow-hidden"
        style={{ borderColor: `${gradeColor}40`, background: `${gradeColor}08` }}
      >
        <div className="flex items-start gap-5">
          {/* Grade Circle */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${gradeColor}20` }}
          >
            <span className="text-3xl font-black font-mono" style={{ color: gradeColor }}>
              {report.progressGrade}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-foreground">Progress Grade</span>
              <span className="text-lg">{getGradeEmoji(report.progressGrade)}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{report.gradeRationale}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{report.daysBetween} days between assessments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-xs text-muted-foreground">{report.improved} improved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown size={12} className="text-red-400" />
                <span className="text-xs text-muted-foreground">{report.declined} declined</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Minus size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{report.unchangedCount} unchanged</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {/* Overall Score */}
        <div className="glass-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Overall Score</div>
          <div className="flex items-baseline gap-2">
            <span className="font-data text-2xl font-black text-foreground">{report.currentOverallPercentage.toFixed(0)}%</span>
            <DeltaDisplay value={report.overallDelta} suffix="%" />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            was {report.previousOverallPercentage.toFixed(0)}%
          </div>
        </div>

        {/* Probability */}
        <div className="glass-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Scaling Probability</div>
          <div className="flex items-baseline gap-2">
            <span className="font-data text-2xl font-black text-gold">{report.currentProbability.toFixed(0)}%</span>
            <DeltaDisplay value={report.probabilityDelta} suffix="%" />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            was {report.previousProbability.toFixed(0)}%
          </div>
        </div>

        {/* Monthly Rate */}
        <div className="glass-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Monthly Rate</div>
          <div className="flex items-baseline gap-2">
            <span className="font-data text-2xl font-black text-foreground">
              {report.monthlyImprovementRate >= 0 ? '+' : ''}{report.monthlyImprovementRate.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">pts/mo</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {report.monthlyImprovementRate > 0 ? 'Improving' : report.monthlyImprovementRate < 0 ? 'Declining' : 'Flat'}
          </div>
        </div>

        {/* Time to Goal */}
        <div className="glass-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Time to Goal</div>
          <div className="flex items-baseline gap-2">
            <span className="font-data text-2xl font-black text-foreground">
              {report.projectedMonthsToGoal != null ? `${report.projectedMonthsToGoal}` : '—'}
            </span>
            {report.projectedMonthsToGoal != null && (
              <span className="text-xs text-muted-foreground">months</span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {report.projectedMonthsToGoal != null
              ? 'at current improvement rate'
              : report.currentOverallPercentage >= 80 ? 'Goal reached!' : 'Not improving'
            }
          </div>
        </div>
      </motion.div>

      {/* Revenue Comparison (if available) */}
      {report.revenueDelta != null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-gold" />
            <h4 className="text-sm font-bold text-foreground">Revenue Change</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Previous</div>
              <div className="font-data text-lg font-bold text-foreground">
                ${(report.previousRevenue || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Current</div>
              <div className="font-data text-lg font-bold text-foreground">
                ${(report.currentRevenue || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Change</div>
              <div className="font-data text-lg font-bold">
                <DeltaDisplay value={report.revenueDelta} prefix="$" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pillar Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-gold" />
          <h4 className="text-sm font-bold text-foreground">Pillar Comparison</h4>
        </div>
        <div className="space-y-3">
          {report.pillarDeltas.map((pillar, i) => (
            <div key={pillar.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{pillar.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">
                    {pillar.previousPercentage.toFixed(0)}% → {pillar.currentPercentage.toFixed(0)}%
                  </span>
                  <DeltaDisplay value={pillar.delta} suffix="%" />
                </div>
              </div>
              {/* Dual progress bar */}
              <div className="relative h-3 rounded-full bg-muted/20 overflow-hidden">
                {/* Previous (faded) */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full opacity-30"
                  style={{
                    width: `${pillar.previousPercentage}%`,
                    background: '#C8962E',
                  }}
                />
                {/* Current */}
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: pillar.delta >= 0 ? '#10B981' : '#EF4444' }}
                  initial={{ width: `${pillar.previousPercentage}%` }}
                  animate={{ width: `${pillar.currentPercentage}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Improvements & Regressions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Improvements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <h4 className="text-sm font-bold text-foreground">Top Improvements</h4>
            <span className="text-[10px] text-emerald-400 ml-auto">{report.improved} total</span>
          </div>
          {report.topImprovements.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No improvements detected</p>
          ) : (
            <div className="space-y-2">
              {report.topImprovements.slice(0, 5).map(d => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{d.label}</div>
                    <div className="text-[10px] text-muted-foreground">{d.pillarLabel}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-data text-xs text-muted-foreground">{d.previousScore}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-data text-xs font-bold text-emerald-400">{d.currentScore}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Regressions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={16} className="text-red-400" />
            <h4 className="text-sm font-bold text-foreground">Regressions</h4>
            <span className="text-[10px] text-red-400 ml-auto">{report.declined} total</span>
          </div>
          {report.topRegressions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No regressions — great job!</p>
          ) : (
            <div className="space-y-2">
              {report.topRegressions.slice(0, 5).map(d => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{d.label}</div>
                    <div className="text-[10px] text-muted-foreground">{d.pillarLabel}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-data text-xs text-muted-foreground">{d.previousScore}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-data text-xs font-bold text-red-400">{d.currentScore}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottleneck Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-gold" />
          <h4 className="text-sm font-bold text-foreground">Bottleneck Analysis</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Resolved */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Resolved</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{report.resolvedBottlenecks.length}</span>
            </div>
            {report.resolvedBottlenecks.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">None resolved</p>
            ) : (
              <div className="space-y-1">
                {report.resolvedBottlenecks.slice(0, 3).map(b => (
                  <div key={b.id} className="text-[10px] text-foreground truncate">{b.label}</div>
                ))}
                {report.resolvedBottlenecks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{report.resolvedBottlenecks.length - 3} more</div>
                )}
              </div>
            )}
          </div>

          {/* New */}
          <div className="rounded-lg border border-red-500/20 bg-red-500/[0.03] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle size={12} className="text-red-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">New Issues</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{report.newBottlenecks.length}</span>
            </div>
            {report.newBottlenecks.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">No new issues</p>
            ) : (
              <div className="space-y-1">
                {report.newBottlenecks.slice(0, 3).map(b => (
                  <div key={b.id} className="text-[10px] text-foreground truncate">{b.label}</div>
                ))}
                {report.newBottlenecks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{report.newBottlenecks.length - 3} more</div>
                )}
              </div>
            )}
          </div>

          {/* Persistent */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} className="text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Persistent</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{report.persistentBottlenecks.length}</span>
            </div>
            {report.persistentBottlenecks.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">None persistent</p>
            ) : (
              <div className="space-y-1">
                {report.persistentBottlenecks.slice(0, 3).map(b => (
                  <div key={b.id} className="text-[10px] text-foreground truncate">{b.label}</div>
                ))}
                {report.persistentBottlenecks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{report.persistentBottlenecks.length - 3} more</div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Business Profile Changes */}
      {report.profileDeltas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gold" />
            <h4 className="text-sm font-bold text-foreground">Business Profile Changes</h4>
          </div>
          <div className="space-y-2">
            {report.profileDeltas.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
                <span className="text-xs text-foreground">{d.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{d.previousValue}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className={`text-xs font-semibold ${d.isImprovement ? 'text-emerald-400' : 'text-red-400'}`}>
                    {d.currentValue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* What This Means (customer-friendly explanation) */}
      {isCustomerView && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="rounded-xl border border-gold/20 bg-gold/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-gold" />
            <h4 className="text-sm font-bold text-foreground">What This Means for Your Business</h4>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            {report.overallDelta > 5 && (
              <p>Your business has made <strong className="text-emerald-400">significant progress</strong> since the last assessment. You're moving in the right direction and the improvements are reflected in your scaling probability.</p>
            )}
            {report.overallDelta > 0 && report.overallDelta <= 5 && (
              <p>You've made <strong className="text-foreground">steady progress</strong> since the last assessment. There's room to accelerate, but the trend is positive.</p>
            )}
            {report.overallDelta === 0 && (
              <p>Your scores are <strong className="text-foreground">unchanged</strong> since the last assessment. This means the recommended improvements haven't been implemented yet.</p>
            )}
            {report.overallDelta < 0 && (
              <p>Some areas have <strong className="text-red-400">declined</strong> since the last assessment. This needs immediate attention to get back on track.</p>
            )}
            {report.projectedMonthsToGoal != null && (
              <p>At your current rate of improvement, you're projected to reach your scaling goal in approximately <strong className="text-gold">{report.projectedMonthsToGoal} months</strong>.</p>
            )}
            {report.resolvedBottlenecks.length > 0 && (
              <p>Great news: you've resolved <strong className="text-emerald-400">{report.resolvedBottlenecks.length} bottleneck{report.resolvedBottlenecks.length > 1 ? 's' : ''}</strong> that were previously holding you back.</p>
            )}
            {report.persistentBottlenecks.length > 0 && (
              <p>There {report.persistentBottlenecks.length === 1 ? 'is' : 'are'} still <strong className="text-amber-400">{report.persistentBottlenecks.length} persistent issue{report.persistentBottlenecks.length > 1 ? 's' : ''}</strong> that need to be addressed. These are your highest-priority action items.</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
