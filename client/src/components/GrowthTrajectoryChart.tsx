/**
 * GrowthTrajectoryChart — Animated SVG chart showing two diverging revenue paths
 *
 * Two lines diverge from current revenue:
 * 1. "Do Nothing" (red, declining) — revenue erodes from market forces
 * 2. "Implement Changes" (green/gold, growing) — S-curve growth toward goal
 *
 * The shaded area between them represents the total cost of inaction.
 * Goal revenue is shown as a dashed reference line.
 *
 * Design: Dark theme, gold accent, cinematic feel matching the report HUD style
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import type { TrajectoryData } from '@/lib/cost-engine';
import { formatCurrency } from '@/lib/cost-engine';

interface GrowthTrajectoryChartProps {
  trajectory: TrajectoryData;
  animateIn?: boolean;
  isCustomerView?: boolean;
}

// Chart dimensions
const CHART_WIDTH = 700;
const CHART_HEIGHT = 320;
const PADDING = { top: 40, right: 90, bottom: 50, left: 75 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

function scaleX(month: number): number {
  return PADDING.left + (month / 12) * PLOT_WIDTH;
}

function scaleY(revenue: number, minY: number, maxY: number): number {
  const range = maxY - minY || 1;
  return PADDING.top + PLOT_HEIGHT - ((revenue - minY) / range) * PLOT_HEIGHT;
}

function buildPath(
  points: { month: number; revenue: number }[],
  minY: number,
  maxY: number
): string {
  return points
    .map((p, i) => {
      const x = scaleX(p.month);
      const y = scaleY(p.revenue, minY, maxY);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function buildAreaPath(
  topPoints: { month: number; revenue: number }[],
  bottomPoints: { month: number; revenue: number }[],
  minY: number,
  maxY: number
): string {
  const topPath = topPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.month)} ${scaleY(p.revenue, minY, maxY)}`)
    .join(' ');
  const bottomPath = [...bottomPoints]
    .reverse()
    .map((p) => `L ${scaleX(p.month)} ${scaleY(p.revenue, minY, maxY)}`)
    .join(' ');
  return `${topPath} ${bottomPath} Z`;
}

export default function GrowthTrajectoryChart({
  trajectory,
  animateIn = true,
  isCustomerView = false,
}: GrowthTrajectoryChartProps) {
  const [revealed, setRevealed] = useState(!animateIn);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (animateIn) {
      const timer = setTimeout(() => setRevealed(true), 400);
      return () => clearTimeout(timer);
    }
  }, [animateIn]);

  // Calculate Y-axis range with padding
  const { minY, maxY } = useMemo(() => {
    const padding = (trajectory.maxRevenue - trajectory.minRevenue) * 0.15;
    return {
      minY: Math.max(0, trajectory.minRevenue - padding),
      maxY: trajectory.maxRevenue + padding,
    };
  }, [trajectory]);

  // Build path data
  const implementPoints = trajectory.points.map((p) => ({
    month: p.month,
    revenue: p.implementRevenue,
  }));
  const doNothingPoints = trajectory.points.map((p) => ({
    month: p.month,
    revenue: p.doNothingRevenue,
  }));

  const implementPath = buildPath(implementPoints, minY, maxY);
  const doNothingPath = buildPath(doNothingPoints, minY, maxY);
  const areaPath = buildAreaPath(implementPoints, doNothingPoints, minY, maxY);

  // Goal line Y position
  const goalY = scaleY(trajectory.goalRevenue, minY, maxY);
  const currentY = scaleY(trajectory.currentRevenue, minY, maxY);

  // Y-axis tick values
  const yTicks = useMemo(() => {
    const range = maxY - minY;
    const step = Math.ceil(range / 5 / 5000) * 5000;
    const ticks: number[] = [];
    let tick = Math.ceil(minY / step) * step;
    while (tick <= maxY) {
      ticks.push(tick);
      tick += step;
    }
    return ticks;
  }, [minY, maxY]);

  // Final positions for labels
  const finalImplementY = scaleY(trajectory.finalImplement, minY, maxY);
  const finalDoNothingY = scaleY(trajectory.finalDoNothing, minY, maxY);
  const gapAmount = trajectory.finalImplement - trajectory.finalDoNothing;

  // Path length for animation
  const pathLength = 1200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={animateIn ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="rounded-xl border border-border/15 bg-muted/[0.03] overflow-hidden"
    >
      {/* Chart Header */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-border/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-gold/60" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.06em]">
            Projected Growth Trajectory
          </h3>
        </div>
        <span className="text-[9px] font-data text-muted-foreground/40">
          12-month revenue projection
        </span>
      </div>

      {/* Legend */}
      <div className="px-5 sm:px-6 pt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded-full bg-[#2ECC71]" />
          <span className="text-[10px] text-muted-foreground/60">Implement Changes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded-full bg-[#E74C3C]" />
          <span className="text-[10px] text-muted-foreground/60">Do Nothing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-[1px] rounded-full border-t border-dashed border-gold/40" style={{ width: 16 }} />
          <span className="text-[10px] text-muted-foreground/60">Goal Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#2ECC71]/10 to-[#E74C3C]/10" />
          <span className="text-[10px] text-muted-foreground/60">Revenue Difference</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="px-3 sm:px-4 pb-4 pt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto"
          style={{ maxHeight: 360 }}
        >
          <defs>
            {/* Gradient for the gap area */}
            <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2ECC71" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#C8962E" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#E74C3C" stopOpacity="0.12" />
            </linearGradient>

            {/* Glow filters */}
            <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Clip path for animation */}
            <clipPath id="revealClip">
              <rect
                x={PADDING.left}
                y={0}
                width={revealed ? PLOT_WIDTH + PADDING.right : 0}
                height={CHART_HEIGHT}
                style={{ transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </clipPath>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick) => {
            const y = scaleY(tick, minY, maxY);
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + PLOT_WIDTH}
                  y2={y}
                  stroke="rgba(200,150,46,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={PADDING.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.25)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {formatCurrency(tick)}
                </text>
              </g>
            );
          })}

          {/* X-axis month labels */}
          {[0, 3, 6, 9, 12].map((m) => (
            <g key={m}>
              <line
                x1={scaleX(m)}
                y1={PADDING.top}
                x2={scaleX(m)}
                y2={PADDING.top + PLOT_HEIGHT}
                stroke="rgba(200,150,46,0.04)"
                strokeWidth="1"
              />
              <text
                x={scaleX(m)}
                y={PADDING.top + PLOT_HEIGHT + 20}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize="9"
                fontFamily="monospace"
              >
                {m === 0 ? 'Now' : `Mo ${m}`}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={CHART_WIDTH / 2}
            y={CHART_HEIGHT - 5}
            textAnchor="middle"
            fill="rgba(255,255,255,0.2)"
            fontSize="9"
            fontFamily="monospace"
          >
            MONTHS FROM NOW
          </text>

          {/* Goal revenue dashed line */}
          <line
            x1={PADDING.left}
            y1={goalY}
            x2={PADDING.left + PLOT_WIDTH}
            y2={goalY}
            stroke="rgba(200,150,46,0.25)"
            strokeWidth="1"
            strokeDasharray="6 4"
          />
          <text
            x={PADDING.left + PLOT_WIDTH + 5}
            y={goalY + 3}
            fill="rgba(200,150,46,0.5)"
            fontSize="9"
            fontFamily="monospace"
          >
            GOAL
          </text>
          <text
            x={PADDING.left + PLOT_WIDTH + 5}
            y={goalY + 14}
            fill="rgba(200,150,46,0.4)"
            fontSize="9"
            fontFamily="monospace"
          >
            {formatCurrency(trajectory.goalRevenue)}
          </text>

          {/* Current revenue marker */}
          <circle
            cx={scaleX(0)}
            cy={currentY}
            r={4}
            fill="#C8962E"
            stroke="rgba(200,150,46,0.3)"
            strokeWidth="6"
          />

          {/* Animated content */}
          <g clipPath="url(#revealClip)">
            {/* Gap area (shaded between curves) */}
            <path d={areaPath} fill="url(#gapGradient)" />

            {/* Do Nothing path */}
            <path
              d={doNothingPath}
              fill="none"
              stroke="#E74C3C"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#redGlow)"
              opacity={0.8}
            />

            {/* Implement path */}
            <path
              d={implementPath}
              fill="none"
              stroke="#2ECC71"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#greenGlow)"
            />

            {/* Data points on implement path */}
            {trajectory.points
              .filter((_, i) => i % 3 === 0 || i === 12)
              .map((p) => (
                <circle
                  key={`impl-${p.month}`}
                  cx={scaleX(p.month)}
                  cy={scaleY(p.implementRevenue, minY, maxY)}
                  r={p.month === 12 ? 5 : 3}
                  fill="#2ECC71"
                  stroke="rgba(46,204,113,0.3)"
                  strokeWidth={p.month === 12 ? 4 : 2}
                />
              ))}

            {/* Data points on do-nothing path */}
            {trajectory.points
              .filter((_, i) => i % 3 === 0 || i === 12)
              .map((p) => (
                <circle
                  key={`dn-${p.month}`}
                  cx={scaleX(p.month)}
                  cy={scaleY(p.doNothingRevenue, minY, maxY)}
                  r={p.month === 12 ? 5 : 3}
                  fill="#E74C3C"
                  stroke="rgba(231,76,60,0.3)"
                  strokeWidth={p.month === 12 ? 4 : 2}
                />
              ))}

            {/* End labels */}
            {/* Implement end label */}
            <rect
              x={PADDING.left + PLOT_WIDTH + 4}
              y={finalImplementY - 12}
              width={78}
              height={22}
              rx={4}
              fill="rgba(46,204,113,0.1)"
              stroke="rgba(46,204,113,0.2)"
              strokeWidth="1"
            />
            <text
              x={PADDING.left + PLOT_WIDTH + 10}
              y={finalImplementY + 2}
              fill="#2ECC71"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {formatCurrency(trajectory.finalImplement)}
            </text>

            {/* Do Nothing end label */}
            <rect
              x={PADDING.left + PLOT_WIDTH + 4}
              y={finalDoNothingY - 12}
              width={78}
              height={22}
              rx={4}
              fill="rgba(231,76,60,0.1)"
              stroke="rgba(231,76,60,0.2)"
              strokeWidth="1"
            />
            <text
              x={PADDING.left + PLOT_WIDTH + 10}
              y={finalDoNothingY + 2}
              fill="#E74C3C"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {formatCurrency(trajectory.finalDoNothing)}
            </text>

            {/* Gap annotation at month 12 */}
            {Math.abs(finalImplementY - finalDoNothingY) > 30 && (
              <g>
                <line
                  x1={PADDING.left + PLOT_WIDTH - 2}
                  y1={finalImplementY}
                  x2={PADDING.left + PLOT_WIDTH - 2}
                  y2={finalDoNothingY}
                  stroke="rgba(200,150,46,0.3)"
                  strokeWidth="1"
                  strokeDasharray="3 2"
                />
                <text
                  x={PADDING.left + PLOT_WIDTH - 8}
                  y={(finalImplementY + finalDoNothingY) / 2 + 3}
                  textAnchor="end"
                  fill="rgba(200,150,46,0.6)"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {formatCurrency(gapAmount)}/mo
                </text>
              </g>
            )}
          </g>

          {/* Plot border */}
          <rect
            x={PADDING.left}
            y={PADDING.top}
            width={PLOT_WIDTH}
            height={PLOT_HEIGHT}
            fill="none"
            stroke="rgba(200,150,46,0.08)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Summary stats below chart */}
      <div className="px-5 sm:px-6 pb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/10 bg-muted/[0.03] p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={10} className="text-[#2ECC71]" />
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40">
              With Changes
            </p>
          </div>
          <p className="font-data text-sm font-bold text-[#2ECC71]">
            {formatCurrency(trajectory.finalImplement)}/mo
          </p>
          <p className="text-[8px] text-muted-foreground/30 mt-0.5">at month 12</p>
        </div>

        <div className="rounded-lg border border-gold/15 bg-gold/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target size={10} className="text-gold/60" />
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40">
              12-Mo Gap
            </p>
          </div>
          <p className="font-data text-sm font-bold text-gold">
            {formatCurrency(trajectory.cumulativeGap)}
          </p>
          <p className="text-[8px] text-muted-foreground/30 mt-0.5">total difference</p>
        </div>

        <div className="rounded-lg border border-red-500/10 bg-red-950/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown size={10} className="text-red-400" />
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40">
              Without Changes
            </p>
          </div>
          <p className="font-data text-sm font-bold text-red-400">
            {formatCurrency(trajectory.finalDoNothing)}/mo
          </p>
          <p className="text-[8px] text-muted-foreground/30 mt-0.5">at month 12</p>
        </div>
      </div>
    </motion.div>
  );
}
