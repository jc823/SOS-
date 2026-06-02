/**
 * Ad Spend ROI Section — Report component
 * Shows algorithmic lead & revenue projections from ad spend data
 */
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Target, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { AdSpendAnalysis, ChannelROI } from '@/lib/ad-spend-engine';
import { getEfficiencyColor } from '@/lib/ad-spend-engine';
import { formatCurrency } from '@/lib/cost-engine';

interface AdSpendROIProps {
  analysis: AdSpendAnalysis;
  animateIn?: boolean;
}

function ChannelBar({ channel, maxSpend, delay }: { channel: ChannelROI; maxSpend: number; delay: number }) {
  const pct = maxSpend > 0 ? (channel.monthlySpend / maxSpend) * 100 : 0;
  const effColor = getEfficiencyColor(channel.efficiency);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{channel.channelLabel}</span>
          <span className="font-data text-[10px] px-1.5 py-0.5 rounded-full" style={{
            color: effColor,
            backgroundColor: `${effColor}12`,
            border: `1px solid ${effColor}20`,
          }}>
            {channel.roi}% ROI
          </span>
        </div>
        <span className="font-data text-xs text-muted-foreground">{formatCurrency(channel.monthlySpend)}/mo</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: effColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
        <span>CPL: ${channel.estimatedCPL.toFixed(0)} · {channel.expectedLeads.toFixed(1)} leads · {channel.expectedCloses.toFixed(1)} closes</span>
        <span className="font-semibold" style={{ color: effColor }}>{formatCurrency(channel.expectedRevenue)} revenue</span>
      </div>
    </div>
  );
}

export default function AdSpendROI({ analysis, animateIn = true }: AdSpendROIProps) {
  if (analysis.totalMonthlySpend === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={animateIn ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={16} className="text-gold" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Ad Spend Analysis</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No ad spend data available.</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Add ad spend in the Business Profile to see ROI projections.</p>
        </div>
      </motion.div>
    );
  }

  const maxSpend = Math.max(...analysis.channelBreakdowns.map(c => c.monthlySpend));

  const roiColor = analysis.overallROI >= 200 ? '#2ECC71'
    : analysis.overallROI >= 100 ? '#8BC34A'
    : analysis.overallROI >= 50 ? '#D4A843'
    : '#E74C3C';

  const RoiIcon = analysis.overallROI >= 100 ? ArrowUpRight
    : analysis.overallROI >= 0 ? Minus
    : ArrowDownRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={animateIn ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gold/10 border border-gold/15">
            <TrendingUp size={14} className="text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Ad Spend ROI Analysis</h3>
            <p className="text-[10px] text-muted-foreground/50">Algorithmic projections based on industry CPL baselines</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/10 mx-5 rounded-lg overflow-hidden mb-4">
        {[
          {
            label: 'Monthly Spend',
            value: formatCurrency(analysis.totalMonthlySpend),
            sub: `${analysis.channelBreakdowns.length} channel${analysis.channelBreakdowns.length !== 1 ? 's' : ''}`,
            icon: DollarSign,
            color: '#C8962E',
          },
          {
            label: 'Expected Leads',
            value: analysis.totalExpectedLeads.toFixed(0),
            sub: `${analysis.blendedCloseRate}% close rate`,
            icon: Users,
            color: '#3B82F6',
          },
          {
            label: 'Expected Revenue',
            value: formatCurrency(analysis.totalExpectedRevenue),
            sub: `${formatCurrency(analysis.revenuePerDollarSpent)} per $1`,
            icon: Target,
            color: '#2ECC71',
          },
          {
            label: 'Overall ROI',
            value: `${analysis.overallROI}%`,
            sub: analysis.overallROI >= 200 ? 'Excellent' : analysis.overallROI >= 100 ? 'Good' : analysis.overallROI >= 50 ? 'Average' : 'Needs Work',
            icon: RoiIcon,
            color: roiColor,
          },
        ].map((metric, i) => (
          <div key={i} className="bg-card p-3 text-center">
            <metric.icon size={14} className="mx-auto mb-1.5" style={{ color: metric.color }} />
            <div className="font-data text-base font-bold text-foreground">{metric.value}</div>
            <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mt-0.5">{metric.label}</div>
            <div className="text-[9px] mt-0.5" style={{ color: metric.color }}>{metric.sub}</div>
          </div>
        ))}
      </div>

      {/* Channel Breakdowns */}
      <div className="px-5 pb-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Channel Performance</span>
          {analysis.bestChannel && (
            <span className="text-[10px] text-emerald-400/70">
              Best: {analysis.bestChannel}
            </span>
          )}
        </div>
        {analysis.channelBreakdowns.map((ch, i) => (
          <ChannelBar key={ch.channel} channel={ch} maxSpend={maxSpend} delay={0.1 + i * 0.1} />
        ))}

        {/* Insight box */}
        <div className="rounded-lg px-4 py-3 mt-3 bg-gold/[0.04] border border-gold/10">
          <p className="text-xs text-foreground/70 leading-relaxed">
            {analysis.isOverspending && (
              <>Your ad spend ROI is below industry average. Consider optimizing your campaigns or shifting budget to better-performing channels. </>
            )}
            {analysis.isUnderspending && (
              <>Your ROI suggests room to scale — increasing spend on your best channels could drive significant additional revenue. </>
            )}
            {!analysis.isOverspending && !analysis.isUnderspending && (
              <>Your ad spend is generating {formatCurrency(analysis.revenuePerDollarSpent)} for every $1 invested.{' '}
                {analysis.bestChannel && analysis.worstChannel && analysis.bestChannel !== analysis.worstChannel
                  ? `Consider shifting more budget from ${analysis.worstChannel} to ${analysis.bestChannel} for better returns.`
                  : 'Your channel allocation looks balanced.'
                }
              </>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
