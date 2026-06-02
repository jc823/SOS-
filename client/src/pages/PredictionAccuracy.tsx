/**
 * Prediction Accuracy Dashboard
 * Shows how well the SOS probability model calibrates over time
 * by comparing predicted probabilities against actual revenue outcomes.
 */
import { useState, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  Target,
  BarChart3,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Calibration Chart (SVG) ───
function CalibrationChart({ buckets }: { buckets: Array<{ range: string; lower: number; upper: number; total: number; hits: number; actualRate: number | null; expectedRate: number }> }) {
  const W = 600, H = 400, PAD = { top: 30, right: 30, bottom: 60, left: 60 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const activeBuckets = buckets.filter(b => b.total > 0);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[600px] mx-auto" style={{ minWidth: 400 }}>
        {/* Background */}
        <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} fill="oklch(0.15 0.01 260)" rx={4} />

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = PAD.top + plotH - (v / 100) * plotH;
          return (
            <g key={`grid-${v}`}>
              <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="oklch(0.25 0.01 260)" strokeDasharray="4,4" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="oklch(0.55 0.01 260)" fontSize={11}>{v}%</text>
            </g>
          );
        })}

        {/* Perfect calibration line (diagonal) */}
        <line
          x1={PAD.left}
          y1={PAD.top + plotH}
          x2={PAD.left + plotW}
          y2={PAD.top}
          stroke="oklch(0.5 0.15 85)"
          strokeWidth={2}
          strokeDasharray="8,4"
          opacity={0.6}
        />
        <text x={PAD.left + plotW - 80} y={PAD.top + 20} fill="oklch(0.6 0.15 85)" fontSize={10} fontStyle="italic">Perfect Calibration</text>

        {/* Actual calibration points */}
        {activeBuckets.map((b, i) => {
          const x = PAD.left + (b.expectedRate / 100) * plotW;
          const y = PAD.top + plotH - ((b.actualRate || 0) / 100) * plotH;
          const radius = Math.max(6, Math.min(16, b.total * 3));
          return (
            <g key={b.range}>
              <motion.circle
                cx={x}
                cy={y}
                r={radius}
                fill="oklch(0.75 0.18 85)"
                fillOpacity={0.3}
                stroke="oklch(0.75 0.18 85)"
                strokeWidth={2}
                initial={{ r: 0, opacity: 0 }}
                animate={{ r: radius, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              />
              <text x={x} y={y - radius - 4} textAnchor="middle" fill="oklch(0.85 0.01 260)" fontSize={10} fontWeight="bold">
                {b.actualRate}%
              </text>
              <text x={x} y={y + 4} textAnchor="middle" fill="oklch(0.15 0.01 260)" fontSize={9} fontWeight="bold">
                n={b.total}
              </text>
            </g>
          );
        })}

        {/* X axis label */}
        <text x={PAD.left + plotW / 2} y={H - 8} textAnchor="middle" fill="oklch(0.6 0.01 260)" fontSize={12}>
          Predicted Probability
        </text>
        {/* Y axis label */}
        <text x={14} y={PAD.top + plotH / 2} textAnchor="middle" fill="oklch(0.6 0.01 260)" fontSize={12} transform={`rotate(-90, 14, ${PAD.top + plotH / 2})`}>
          Actual Hit Rate
        </text>

        {/* X axis ticks */}
        {[0, 25, 50, 75, 100].map(v => {
          const x = PAD.left + (v / 100) * plotW;
          return (
            <text key={`xtick-${v}`} x={x} y={PAD.top + plotH + 20} textAnchor="middle" fill="oklch(0.55 0.01 260)" fontSize={11}>{v}%</text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Revenue Scatter Chart (SVG) ───
function RevenueScatterChart({ points }: { points: Array<{ prevProbability: number; revenueChangePercent: number; shopName: string; hitTarget: boolean }> }) {
  const W = 600, H = 350, PAD = { top: 30, right: 30, bottom: 60, left: 70 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxChange = Math.max(50, ...points.map(p => Math.abs(p.revenueChangePercent)));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[600px] mx-auto" style={{ minWidth: 400 }}>
        <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} fill="oklch(0.15 0.01 260)" rx={4} />

        {/* Zero line */}
        <line
          x1={PAD.left}
          y1={PAD.top + plotH / 2}
          x2={PAD.left + plotW}
          y2={PAD.top + plotH / 2}
          stroke="oklch(0.4 0.01 260)"
          strokeWidth={1}
        />

        {/* Grid */}
        {[-50, -25, 0, 25, 50].map(v => {
          if (Math.abs(v) > maxChange) return null;
          const y = PAD.top + plotH / 2 - (v / maxChange) * (plotH / 2);
          return (
            <g key={`ygrid-${v}`}>
              <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="oklch(0.22 0.01 260)" strokeDasharray="3,3" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="oklch(0.55 0.01 260)" fontSize={10}>{v > 0 ? '+' : ''}{v}%</text>
            </g>
          );
        })}

        {/* Data points */}
        {points.map((p, i) => {
          const x = PAD.left + (p.prevProbability / 100) * plotW;
          const y = PAD.top + plotH / 2 - (p.revenueChangePercent / maxChange) * (plotH / 2);
          const clampedY = Math.max(PAD.top + 4, Math.min(PAD.top + plotH - 4, y));
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={clampedY}
              r={6}
              fill={p.hitTarget ? 'oklch(0.7 0.2 150)' : 'oklch(0.7 0.2 25)'}
              fillOpacity={0.7}
              stroke={p.hitTarget ? 'oklch(0.8 0.2 150)' : 'oklch(0.8 0.2 25)'}
              strokeWidth={1.5}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: 6, opacity: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <title>{p.shopName}: {p.prevProbability}% predicted, {p.revenueChangePercent > 0 ? '+' : ''}{p.revenueChangePercent}% revenue change</title>
            </motion.circle>
          );
        })}

        {/* Axes */}
        <text x={PAD.left + plotW / 2} y={H - 8} textAnchor="middle" fill="oklch(0.6 0.01 260)" fontSize={12}>
          Predicted Probability (%)
        </text>
        <text x={14} y={PAD.top + plotH / 2} textAnchor="middle" fill="oklch(0.6 0.01 260)" fontSize={12} transform={`rotate(-90, 14, ${PAD.top + plotH / 2})`}>
          Revenue Change (%)
        </text>

        {/* X ticks */}
        {[0, 25, 50, 75, 100].map(v => (
          <text key={`xsc-${v}`} x={PAD.left + (v / 100) * plotW} y={PAD.top + plotH + 20} textAnchor="middle" fill="oklch(0.55 0.01 260)" fontSize={11}>{v}%</text>
        ))}

        {/* Legend */}
        <circle cx={PAD.left + plotW - 120} cy={PAD.top + 14} r={5} fill="oklch(0.7 0.2 150)" />
        <text x={PAD.left + plotW - 110} y={PAD.top + 18} fill="oklch(0.7 0.2 150)" fontSize={10}>Hit Target</text>
        <circle cx={PAD.left + plotW - 40} cy={PAD.top + 14} r={5} fill="oklch(0.7 0.2 25)" />
        <text x={PAD.left + plotW - 30} y={PAD.top + 18} fill="oklch(0.7 0.2 25)" fontSize={10}>Missed</text>
      </svg>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ icon: Icon, label, value, subtext, color = 'gold' }: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'gold' | 'green' | 'red' | 'blue';
}) {
  const colorMap = {
    gold: 'text-gold border-gold/30 bg-gold/5',
    green: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
    red: 'text-red-400 border-red-400/30 bg-red-400/5',
    blue: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  };
  const iconColorMap = {
    gold: 'text-gold',
    green: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={iconColorMap[color]} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
      </div>
      <div className="font-data text-2xl font-bold">{value}</div>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}

// ─── Shop Prediction Row ───
function ShopPredictionRow({ point }: { point: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {point.hitTarget ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <XCircle size={16} className="text-red-400 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="text-sm font-semibold text-foreground truncate block">{point.shopName}</span>
            <span className="text-[10px] text-muted-foreground">
              {point.prevAssessmentDate} → {point.reassessmentDate}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Predicted</div>
            <div className="font-data text-sm font-bold text-gold">{point.prevProbability}%</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Actual Revenue</div>
            <div className="font-data text-sm font-bold text-foreground">
              ${(point.actualRevenue / 1000).toFixed(0)}k
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Change</div>
            <div className={`font-data text-sm font-bold ${point.revenueChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {point.revenueChangePercent > 0 ? '+' : ''}{point.revenueChangePercent}%
            </div>
          </div>
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-white/[0.06] p-3 bg-white/[0.02]"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Previous Score</span>
              <div className="font-data font-bold text-foreground">{point.prevPercentage?.toFixed(0)}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">New Score</span>
              <div className="font-data font-bold text-foreground">{point.newPercentage?.toFixed(0)}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">Score Change</span>
              <div className={`font-data font-bold ${point.scoreChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {point.scoreChange > 0 ? '+' : ''}{point.scoreChange?.toFixed(1)}%
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Goal Achievement</span>
              <div className="font-data font-bold text-gold">{(point.achievementRatio * 100).toFixed(0)}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">Previous Revenue</span>
              <div className="font-data font-bold text-foreground">
                {point.prevCurrentRevenue > 0 ? `$${(point.prevCurrentRevenue / 1000).toFixed(0)}k/mo` : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Goal Revenue</span>
              <div className="font-data font-bold text-foreground">
                {point.prevGoalRevenue > 0 ? `$${(point.prevGoalRevenue / 1000).toFixed(0)}k/mo` : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Revenue Tier</span>
              <div className="font-data font-bold text-foreground">{point.prevRevenueTier}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Revenue $ Change</span>
              <div className={`font-data font-bold ${point.revenueChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {point.revenueChange >= 0 ? '+' : ''}${(point.revenueChange / 1000).toFixed(1)}k/mo
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───
export default function PredictionAccuracy() {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading, error } = trpc.predictions.accuracy.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft size={14} />
                Dashboard
              </Button>
            </Link>
            <div className="h-5 w-px bg-border/40" />
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-gold" />
              <span className="text-sm font-bold text-foreground">Prediction Accuracy</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading prediction data...</div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">Failed to load prediction data</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </div>
        )}

        {data && (
          <>
            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  icon={BarChart3}
                  label="Total Assessments"
                  value={data.summary.totalAssessments}
                  subtext="All assessments in the system"
                  color="blue"
                />
                <StatCard
                  icon={Target}
                  label="Reassessments Tracked"
                  value={data.summary.totalReassessments}
                  subtext="With actual revenue data"
                  color="gold"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Target Hit Rate"
                  value={`${data.summary.overallHitRate}%`}
                  subtext={`${data.summary.totalReassessments > 0 ? 'Of shops that were reassessed' : 'No reassessment data yet'}`}
                  color="green"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Avg Revenue Growth"
                  value={`${data.summary.avgRevenueGrowth > 0 ? '+' : ''}${data.summary.avgRevenueGrowth}%`}
                  subtext="Average across all reassessments"
                  color={data.summary.avgRevenueGrowth >= 0 ? 'green' : 'red'}
                />
              </div>
            </motion.div>

            {/* Model Health */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={16} className="text-gold" />
                  <h3 className="text-sm font-bold text-foreground">Model Health</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border/20 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                      Avg Predicted Probability
                    </div>
                    <div className="font-data text-xl font-bold text-gold">{data.summary.avgPredictedProbability}%</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Average probability assigned to shops</p>
                  </div>
                  <div className="rounded-lg border border-border/20 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                      Avg Goal Achievement
                    </div>
                    <div className="font-data text-xl font-bold text-emerald-400">{data.summary.avgActualAchievement}%</div>
                    <p className="text-[10px] text-muted-foreground mt-1">How close shops get to their revenue goal</p>
                  </div>
                  <div className="rounded-lg border border-border/20 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                      Calibration Error
                    </div>
                    <div className={`font-data text-xl font-bold ${data.summary.calibrationError <= 10 ? 'text-emerald-400' : data.summary.calibrationError <= 20 ? 'text-gold' : 'text-red-400'}`}>
                      {data.summary.calibrationError}%
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {data.summary.calibrationError <= 10 ? 'Excellent — model is well-calibrated' :
                       data.summary.calibrationError <= 20 ? 'Good — minor adjustments needed' :
                       'Needs attention — significant calibration drift'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Calibration Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={16} className="text-gold" />
                  <h3 className="text-sm font-bold text-foreground">Calibration Curve</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Compares predicted probability (X) against actual target hit rate (Y). Points on the diagonal line indicate perfect calibration.
                  Bubble size reflects sample count.
                </p>
                {data.predictionPoints.length > 0 ? (
                  <CalibrationChart buckets={data.calibrationBuckets} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Target size={32} className="text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No calibration data yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Reassess shops with actual revenue data to start building the calibration curve
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Revenue Scatter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-gold" />
                  <h3 className="text-sm font-bold text-foreground">Prediction vs Revenue Change</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Each dot is a reassessed shop. X-axis shows the probability we predicted, Y-axis shows their actual revenue change.
                  Green = hit target, Red = missed.
                </p>
                {data.predictionPoints.length > 0 ? (
                  <RevenueScatterChart points={data.predictionPoints} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <TrendingUp size={32} className="text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No prediction data yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Complete reassessments with actual revenue to populate this chart
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Per-Tier Accuracy */}
            {data.tierAccuracy.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={16} className="text-gold" />
                    <h3 className="text-sm font-bold text-foreground">Accuracy by Revenue Tier</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Tier</th>
                          <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Shops</th>
                          <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Avg Predicted</th>
                          <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Hit Rate</th>
                          <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Avg Achievement</th>
                          <th className="text-right py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.tierAccuracy.map((tier) => {
                          const diff = Math.abs(tier.hitRate - tier.avgProbability);
                          const accuracy = diff <= 10 ? 'excellent' : diff <= 20 ? 'good' : 'poor';
                          return (
                            <tr key={tier.tier} className="border-b border-border/10 hover:bg-white/[0.02]">
                              <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{tier.tier}</td>
                              <td className="py-2.5 px-3 text-center font-data text-muted-foreground">{tier.total}</td>
                              <td className="py-2.5 px-3 text-center font-data text-gold">{tier.avgProbability}%</td>
                              <td className="py-2.5 px-3 text-center font-data text-foreground">{tier.hitRate}%</td>
                              <td className="py-2.5 px-3 text-center font-data text-emerald-400">{tier.avgAchievement}%</td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  accuracy === 'excellent' ? 'bg-emerald-400/10 text-emerald-400' :
                                  accuracy === 'good' ? 'bg-gold/10 text-gold' :
                                  'bg-red-400/10 text-red-400'
                                }`}>
                                  {accuracy === 'excellent' ? '◉' : accuracy === 'good' ? '◎' : '○'} {accuracy}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Per-Shop Prediction History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={16} className="text-gold" />
                  <h3 className="text-sm font-bold text-foreground">Shop Prediction History</h3>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {data.predictionPoints.length} reassessment{data.predictionPoints.length !== 1 ? 's' : ''} tracked
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Each row shows a reassessed shop with its predicted probability, actual revenue, and whether they hit their target.
                </p>
                {data.predictionPoints.length > 0 ? (
                  <div className="space-y-2">
                    {data.predictionPoints.map((point: any) => (
                      <ShopPredictionRow key={point.reassessmentId} point={point} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 size={32} className="text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No shop predictions to display</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 max-w-md">
                      When you reassess a shop and enter their actual monthly revenue, the prediction data will appear here.
                      This helps validate whether the SOS probability model is accurately predicting outcomes.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Outcomes Log */}
            {data.outcomePoints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 size={16} className="text-gold" />
                    <h3 className="text-sm font-bold text-foreground">Outcome Log</h3>
                  </div>
                  <div className="space-y-2">
                    {data.outcomePoints.map((o: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          {o.hitTarget === 'yes' ? (
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          ) : o.hitTarget === 'partial' ? (
                            <AlertTriangle size={16} className="text-gold" />
                          ) : (
                            <XCircle size={16} className="text-red-400" />
                          )}
                          <div>
                            <span className="text-sm font-semibold text-foreground">{o.shopName}</span>
                            <span className="text-xs text-muted-foreground ml-2">{o.assessmentDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="text-muted-foreground">Predicted: </span>
                            <span className="font-data font-bold text-gold">{o.probability}%</span>
                          </div>
                          {o.outcomeRevenue && (
                            <div className="text-right">
                              <span className="text-muted-foreground">Actual: </span>
                              <span className="font-data font-bold text-foreground">${(o.outcomeRevenue / 1000).toFixed(0)}k</span>
                            </div>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.hitTarget === 'yes' ? 'bg-emerald-400/10 text-emerald-400' :
                            o.hitTarget === 'partial' ? 'bg-gold/10 text-gold' :
                            'bg-red-400/10 text-red-400'
                          }`}>
                            {o.hitTarget}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
