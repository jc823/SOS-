/*
 * BottleneckPanel v3 — Ranked bottleneck deficits + top 3 leverage priorities
 * Works with percentage-based scoring.
 */
import { motion } from 'framer-motion';
import { Target, TrendingDown } from 'lucide-react';
import { getBandColor } from '@/lib/sos-engine';
import type { SOSResult } from '@/lib/sos-engine';

interface BottleneckPanelProps {
  result: SOSResult;
  notes: Record<string, string>;
}

export default function BottleneckPanel({ result, notes }: BottleneckPanelProps) {
  const { bottlenecks, topLeveragePriorities } = result;
  const activeBottlenecks = bottlenecks.filter(b => b.weightedDeficit > 0);

  if (activeBottlenecks.length === 0) {
    return (
      <div className="rounded-xl border border-[#2ECC71]/20 bg-card p-6 text-center glow-green">
        <div className="text-[#2ECC71] mb-2">
          <Target size={32} className="mx-auto" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Perfect Score!</h3>
        <p className="text-sm text-muted-foreground mt-1">All systems nominal. No bottlenecks detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top 3 Leverage Priorities */}
      <div className="rounded-xl border border-gold/20 bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30 bg-gold/5">
          <Target size={16} className="text-gold" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold">
            Top 3 Leverage Priorities
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {topLeveragePriorities.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="shrink-0 w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center">
                <span className="font-data text-xs font-bold text-gold">#{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{item.label}</span>
                  <span className="shrink-0 font-data text-xs font-bold text-[#E74C3C]">
                    {item.score}/5
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {item.pillarLabel}
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-[10px] text-muted-foreground">
                    Gap: {item.gapPoints.toFixed(0)} weighted pts
                  </span>
                </div>
                {notes[item.id] && (
                  <p className="text-xs text-muted-foreground/70 mt-1 italic">"{notes[item.id]}"</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Bottleneck Ranking */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30 bg-[#E74C3C]/5">
          <TrendingDown size={16} className="text-[#E74C3C]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#E74C3C]">
            Bottleneck Ranking
          </h3>
          <span className="text-[10px] text-muted-foreground ml-auto">
            By weighted deficit
          </span>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {activeBottlenecks.slice(0, 12).map((item, i) => {
            const maxDeficit = activeBottlenecks[0]?.weightedDeficit || 1;
            const barWidth = (item.weightedDeficit / maxDeficit) * 100;
            const severity = item.weightedDeficit >= 4 ? 'red' : item.weightedDeficit >= 2 ? 'yellow' : 'green';
            const color = getBandColor(severity as 'red' | 'yellow' | 'green');

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
              >
                <span className="shrink-0 w-6 font-data text-[10px] text-muted-foreground text-right">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground truncate">{item.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-data text-[10px] text-muted-foreground">
                        {item.score}/5
                      </span>
                      <span className="font-data text-xs font-bold" style={{ color }}>
                        {item.weightedDeficit.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: i * 0.03 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
