/**
 * GrowthSimulator — Unified Probability + What-If + Ad Spend section
 *
 * Merges the old Probability Engine and What-If Simulator into one
 * easy-to-understand interactive section. Shows:
 * 1. Current probability (big number) + radar chart
 * 2. Pillar-level improvement sliders (simplified)
 * 3. Ad spend slider showing projected leads/closes/revenue
 * All update live as the user adjusts sliders.
 */
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, TrendingUp, RotateCcw, DollarSign,
  Shield, BarChart3, Activity, Layers,
  Users, Megaphone, ArrowRight, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PILLARS, computeSOS, computeScalingProbability,
  getBandColor, getProbabilityColor, getProbabilityLabel,
  type RevenueTier, type SubcategoryInput, type SOSResult, type ScalingProbability,
} from '@/lib/sos-engine';
import { computeAdSpendROI } from '@/lib/ad-spend-engine';
import type { BusinessProfile } from '@shared/business-profile';

interface GrowthSimulatorProps {
  inputs: Record<string, SubcategoryInput>;
  result: SOSResult;
  probability: ScalingProbability;
  revenueTier: RevenueTier;
  customTarget?: number;
  onTierChange?: (tier: RevenueTier, customTarget?: number) => void;
  businessProfile?: BusinessProfile | null;
  animateIn?: boolean;
}

const PILLAR_ICONS = [Shield, BarChart3, Activity, Layers];
const PILLAR_META = [
  { id: 'services', label: 'Services', color: '#3B82F6', icon: Shield },
  { id: 'sales', label: 'Sales', color: '#8B5CF6', icon: BarChart3 },
  { id: 'ads', label: 'Ads & Marketing', color: '#F59E0B', icon: Megaphone },
  { id: 'team', label: 'Team & Ops', color: '#10B981', icon: Users },
];

const AD_SPEND_PRESETS = [0, 500, 1000, 2000, 3000, 5000];

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${n}`;
const fmtFull = (n: number) => `$${n.toLocaleString()}`;

export default function GrowthSimulator({
  inputs,
  result,
  probability,
  revenueTier,
  customTarget,
  onTierChange,
  businessProfile,
  animateIn = true,
}: GrowthSimulatorProps) {
  // ─── What-If State: pillar-level adjustments (0-5 average) ───
  const [pillarBoosts, setPillarBoosts] = useState<Record<string, number>>({});
  const [adSpendLevel, setAdSpendLevel] = useState<number>(
    businessProfile
      ? Math.round(
          (businessProfile.adSpend.googleAds || 0) +
          (businessProfile.adSpend.facebookMeta || 0)
        )
      : 0
  );

  // Build modified inputs from pillar boosts
  const modifiedInputs = useMemo(() => {
    const modified = { ...inputs };
    for (const pillar of PILLARS) {
      const boost = pillarBoosts[pillar.id];
      if (boost === undefined) continue;
      // Boost each subcategory proportionally toward 5
      for (const sub of pillar.subcategories) {
        const orig = inputs[sub.id]?.score ?? 0;
        // boost is the target average for the pillar (1-5)
        // Scale each sub toward 5 proportionally
        const targetScore = Math.min(5, Math.max(0, Math.round(boost)));
        // Only boost up, never reduce
        const newScore = Math.max(orig, targetScore);
        modified[sub.id] = { ...modified[sub.id], score: newScore };
      }
    }
    return modified;
  }, [inputs, pillarBoosts]);

  // Compute modified results
  const modifiedResult = useMemo(() => computeSOS(modifiedInputs), [modifiedInputs]);
  const modifiedProbability = useMemo(
    () => computeScalingProbability(modifiedResult, revenueTier, customTarget, adSpendLevel, modifiedInputs),
    [modifiedResult, revenueTier, customTarget, adSpendLevel, modifiedInputs]
  );

  const hasChanges = Object.keys(pillarBoosts).length > 0;
  const probDelta = modifiedProbability.overall - probability.overall;

  // Ad Spend Projection using the engine
  const adSpendProjection = useMemo(() => {
    const adsPillar = (hasChanges ? modifiedResult : result).pillars.find(p => p.id === 'ads');
    const salesPillar = (hasChanges ? modifiedResult : result).pillars.find(p => p.id === 'sales');
    const adsScore = adsPillar?.percentage || 50;
    const salesScore = salesPillar?.percentage || 50;
    const avgTicket = businessProfile?.averageTicketSize || 250;

    // Build a synthetic profile with the slider ad spend distributed across channels
    const syntheticProfile: BusinessProfile = {
      ...(businessProfile || {
        adSpend: { googleAds: null, facebookMeta: null },
        employees: { detailers: { count: 0, monthlyCost: null }, salesFrontDesk: { count: 0, monthlyCost: null }, managers: { count: 0, monthlyCost: null }, adminSupport: { count: 0, monthlyCost: null }, other: { count: 0, monthlyCost: null } },
        averageTicketSize: 250,
        yearsInBusiness: null,
        facilityTypes: [],
        serviceFocus: [],
        repeatRate: null,
        repeatRateUnknown: false,
        onlinePresence: { googleBusinessProfile: false, googleRating: null, website: false, activeSocialMedia: false, onlineBooking: false },
      }),
      adSpend: {
        googleAds: Math.round(adSpendLevel * 0.5) || null,
        facebookMeta: Math.round(adSpendLevel * 0.5) || null,
      },
    };

    return computeAdSpendROI(syntheticProfile, adsScore, salesScore, avgTicket);
  }, [adSpendLevel, result, modifiedResult, hasChanges, businessProfile]);

  const handleReset = useCallback(() => {
    setPillarBoosts({});
    setAdSpendLevel(
      businessProfile
        ? Math.round(
            (businessProfile.adSpend.googleAds || 0) +
            (businessProfile.adSpend.facebookMeta || 0)
          )
        : 0
    );
  }, [businessProfile]);

  const displayProb = hasChanges ? modifiedProbability : probability;
  const displayResult = hasChanges ? modifiedResult : result;
  const probColor = getProbabilityColor(displayProb.overall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={animateIn ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.25 }}
      className="rounded-2xl border border-gold/15 bg-card overflow-hidden print:break-inside-avoid"
    >
      {/* Header */}
      <div className="px-6 sm:px-8 py-4 border-b border-gold/8 bg-gradient-to-r from-gold/5 to-transparent flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
          <Zap size={18} className="text-gold" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-[0.08em]">Growth Simulator</h2>
          <p className="text-[9px] text-muted-foreground/50 font-mono">
            Probability engine · What-if analysis · Ad spend projections
          </p>
        </div>
        {hasChanges && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-7 text-[10px] gap-1 border-border/30 hover:border-gold/40 hover:text-gold"
          >
            <RotateCcw size={10} />
            Reset
          </Button>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* ─── TOP: Probability + Radar ─── */}
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Left: Big Probability */}
          <div className="shrink-0 text-center space-y-3">
            <div className="relative w-48 h-48 mx-auto">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <linearGradient id="gs-ring-g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={probColor} />
                    <stop offset="100%" stopColor={probColor} stopOpacity="0.3" />
                  </linearGradient>
                  <filter id="gs-ring-glow">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(200,150,46,0.06)" strokeWidth="1" />
                <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
                <motion.circle
                  cx="100" cy="100" r="75" fill="none"
                  stroke="url(#gs-ring-g)"
                  strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 75}
                  initial={{ strokeDashoffset: 2 * Math.PI * 75 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 75 * (1 - displayProb.overall / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  transform="rotate(-90 100 100)"
                  filter="url(#gs-ring-glow)"
                />
                <text x="100" y="92" textAnchor="middle" fill="white" fontFamily="'JetBrains Mono'" fontWeight="800" fontSize="42">
                  {Math.round(displayProb.overall)}
                </text>
                <text x="100" y="92" textAnchor="middle" fill="white" fontFamily="'JetBrains Mono'" fontWeight="800" fontSize="16" dx="28" dy="-12">
                  %
                </text>
                <text x="100" y="115" textAnchor="middle" fill={probColor} fontFamily="'Space Grotesk'" fontWeight="600" fontSize="10" letterSpacing="0.12em">
                  {getProbabilityLabel(displayProb.overall).toUpperCase()}
                </text>
                <text x="100" y="132" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontFamily="'Space Grotesk'" fontSize="8" letterSpacing="0.15em">
                  SCALING PROBABILITY
                </text>
              </svg>
            </div>
            {hasChanges && probDelta !== 0 && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${probDelta > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <TrendingUp size={12} className={probDelta < 0 ? 'rotate-180' : ''} />
                {probDelta > 0 ? '+' : ''}{probDelta.toFixed(1)}% from changes
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/50 max-w-[200px] mx-auto leading-relaxed">
              Your chances of reaching <strong className="text-foreground/70">{probability.tierLabel}</strong> based on your current scores
            </p>
          </div>

          {/* Right: Pillar Breakdown (simple) */}
          <div className="flex-1 min-w-0 space-y-4 w-full">
            <div className="flex items-center gap-2 pb-2 border-b border-gold/8">
              <Target size={12} className="text-gold/50" />
              <span className="font-data text-[9px] font-bold uppercase tracking-[0.12em] text-gold/50">Pillar Performance</span>
            </div>
            {displayResult.pillars.map((pillar, i) => {
              const meta = PILLAR_META[i];
              const Icon = meta?.icon || Shield;
              const color = meta?.color || '#C8962E';
              const contribution = displayProb.pillarContributions[i];
              return (
                <div key={pillar.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                        <Icon size={12} style={{ color }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{pillar.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-data text-[9px] text-muted-foreground/40">
                        Weight: <span className="text-foreground/60 font-bold">{contribution?.weight || 25}%</span>
                      </span>
                      <span className="font-data text-sm font-bold" style={{ color: getBandColor(pillar.band) }}>
                        {pillar.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pillar.percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + i * 0.1 }}
                    />
                  </div>
                  <p className="font-data text-[8px] text-muted-foreground/30">
                    {pillar.percentage >= 80 ? 'Strong contributor — driving probability up' :
                     pillar.percentage >= 60 ? 'Moderate — room for improvement' :
                     'Weak — dragging probability down'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── DEPENDENCY GATES & REVENUE CEILING ─── */}
        {displayProb.dependencyGates && displayProb.dependencyGates.length > 0 && (
          <div className="space-y-4">
            {/* Revenue Ceiling Bar */}
            <div className="rounded-xl border border-border/15 bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-gold/60" />
                <span className="font-data text-[9px] font-bold uppercase tracking-[0.12em] text-gold/50">Revenue Ceiling Analysis</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="text-center rounded-lg border border-border/15 bg-white/[0.02] p-3">
                  <div className="text-[8px] text-muted-foreground/40 uppercase mb-1">Ad Spend Ceiling</div>
                  <div className="font-data text-base font-bold text-blue-400">{fmt(displayProb.adSpendCeiling)}<span className="text-[9px] text-muted-foreground/40">/mo</span></div>
                </div>
                <div className="text-center rounded-lg border border-border/15 bg-white/[0.02] p-3">
                  <div className="text-[8px] text-muted-foreground/40 uppercase mb-1">Team Capacity Ceiling</div>
                  <div className="font-data text-base font-bold text-purple-400">{fmt(displayProb.capacityCeiling)}<span className="text-[9px] text-muted-foreground/40">/mo</span></div>
                </div>
                <div className="text-center rounded-lg border border-border/15 bg-white/[0.02] p-3">
                  <div className="text-[8px] text-muted-foreground/40 uppercase mb-1">Systems Ceiling</div>
                  <div className="font-data text-base font-bold text-amber-400">{fmt(displayProb.systemsCeiling)}<span className="text-[9px] text-muted-foreground/40">/mo</span></div>
                </div>
              </div>
              <div className="rounded-lg border-2 border-gold/20 bg-gold/[0.03] p-4 text-center">
                <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1">Your Revenue Ceiling</div>
                <div className="font-data text-2xl font-bold text-gold">{fmt(displayProb.revenueCeiling)}<span className="text-sm text-gold/50">/mo</span></div>
                <div className="text-[9px] text-muted-foreground/40 mt-1">You're capped by your weakest link</div>
              </div>
            </div>

            {/* Dependency Gates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {displayProb.dependencyGates.map(gate => (
                <div
                  key={gate.id}
                  className={`rounded-lg p-3 border transition-all ${
                    gate.met
                      ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                      : 'border-red-500/25 bg-red-500/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`w-2 h-2 rounded-full ${gate.met ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
                    <span className="text-[10px] font-bold text-foreground">{gate.label}</span>
                  </div>
                  <p className={`text-[9px] leading-relaxed ${gate.met ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                    {gate.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {displayProb.warnings && displayProb.warnings.length > 0 && (
              <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-red-400 text-xs font-bold">!</span>
                  </div>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">What's Holding You Back</span>
                </div>
                {displayProb.warnings.map((warning, i) => (
                  <p key={i} className="text-xs text-red-300/70 leading-relaxed pl-7">
                    {warning}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Revenue Goal Toggle ─── */}
        {onTierChange && (
          <div className="rounded-xl border border-gold/12 bg-gold/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={13} className="text-gold/60" />
              <span className="font-data text-[9px] font-bold uppercase tracking-[0.12em] text-gold/50">Revenue Goal</span>
              <span className="text-[8px] text-muted-foreground/30 ml-auto">Toggle to see probability at different targets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: '20-30' as RevenueTier, label: '$20k–$30k/mo' },
                { value: '30-40' as RevenueTier, label: '$30k–$40k/mo' },
                { value: '40-50' as RevenueTier, label: '$40k–$50k/mo' },
                { value: 'custom' as RevenueTier, label: 'Custom Target' },
              ].map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => onTierChange(tier.value, tier.value === 'custom' ? (customTarget || 60000) : undefined)}
                  className={`
                    rounded-lg border px-3 py-2.5 text-center transition-all
                    ${revenueTier === tier.value
                      ? 'border-gold bg-gold/10 text-gold shadow-[0_0_12px_rgba(200,150,46,0.15)]'
                      : 'border-border/20 bg-white/[0.02] text-muted-foreground/60 hover:border-gold/30 hover:text-foreground'
                    }
                  `}
                >
                  <span className="text-xs font-semibold">{tier.label}</span>
                </button>
              ))}
            </div>
            {revenueTier === 'custom' && (
              <div className="mt-3 flex items-center gap-3">
                <label className="text-[10px] text-muted-foreground/40 shrink-0 font-mono">Target $/mo:</label>
                <input
                  type="number"
                  value={customTarget || 60000}
                  onChange={(e) => onTierChange('custom', Math.max(10000, Number(e.target.value)))}
                  step={5000}
                  min={10000}
                  className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm font-data text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                />
              </div>
            )}
          </div>
        )}

        {/* ─── WHAT-IF: Pillar Improvement Sliders ─── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gold/8">
            <TrendingUp size={12} className="text-gold/50" />
            <span className="font-data text-[9px] font-bold uppercase tracking-[0.12em] text-gold/50">What-If: Improve Pillars</span>
            <span className="text-[8px] text-muted-foreground/30 ml-auto">Drag sliders to simulate improvements</span>
          </div>

          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Move the sliders to see how improving each area would change your scaling probability. The probability ring above updates in real-time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PILLARS.map((pillar, i) => {
              const meta = PILLAR_META[i];
              const Icon = meta?.icon || Shield;
              const color = meta?.color || '#C8962E';
              const currentAvg = result.pillars[i]?.percentage || 0;
              const currentScoreAvg = Math.round((currentAvg / 100) * 5 * 10) / 10;
              const boostValue = pillarBoosts[pillar.id];
              const isModified = boostValue !== undefined;
              const displayValue = isModified ? boostValue : currentScoreAvg;

              return (
                <div
                  key={pillar.id}
                  className={`rounded-xl p-4 transition-all ${isModified ? 'border-2 border-gold/20 bg-gold/[0.03]' : 'border border-border/15 bg-white/[0.02]'}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-foreground block">{meta?.label || pillar.label}</span>
                      <span className="text-[9px] text-muted-foreground/40 font-mono">
                        Current: {currentScoreAvg.toFixed(1)}/5
                        {isModified && (
                          <> → <span className="text-gold font-bold">{boostValue.toFixed(1)}/5</span></>
                        )}
                      </span>
                    </div>
                    {isModified && (
                      <button
                        onClick={() => {
                          setPillarBoosts(prev => {
                            const next = { ...prev };
                            delete next[pillar.id];
                            return next;
                          });
                        }}
                        className="text-[8px] text-muted-foreground/40 hover:text-gold transition-colors"
                      >
                        <RotateCcw size={10} />
                      </button>
                    )}
                  </div>

                  {/* Slider */}
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={0.5}
                      value={displayValue}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (Math.abs(val - currentScoreAvg) < 0.3) {
                          // Close to original — remove boost
                          setPillarBoosts(prev => {
                            const next = { ...prev };
                            delete next[pillar.id];
                            return next;
                          });
                        } else {
                          setPillarBoosts(prev => ({ ...prev, [pillar.id]: val }));
                        }
                      }}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${color} 0%, ${color} ${(displayValue / 5) * 100}%, rgba(255,255,255,0.06) ${(displayValue / 5) * 100}%, rgba(255,255,255,0.06) 100%)`,
                        accentColor: color,
                      }}
                    />
                    <div className="flex justify-between text-[8px] font-data text-muted-foreground/30">
                      <span>0</span>
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Impact summary */}
          {hasChanges && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">Simulated Impact</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="text-center">
                  <div className="text-[9px] text-muted-foreground/50 uppercase mb-0.5">Score</div>
                  <div className="font-data text-sm font-bold text-foreground">
                    {result.percentage.toFixed(0)}% <ArrowRight size={10} className="inline text-gold/50" /> <span className="text-emerald-400">{modifiedResult.percentage.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-muted-foreground/50 uppercase mb-0.5">Probability</div>
                  <div className="font-data text-sm font-bold text-foreground">
                    {probability.overall.toFixed(0)}% <ArrowRight size={10} className="inline text-gold/50" /> <span className="text-emerald-400">{modifiedProbability.overall.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-muted-foreground/50 uppercase mb-0.5">Delta</div>
                  <div className={`font-data text-sm font-bold ${probDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {probDelta > 0 ? '+' : ''}{probDelta.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── AD SPEND SLIDER ─── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gold/8">
            <DollarSign size={12} className="text-gold/50" />
            <span className="font-data text-[9px] font-bold uppercase tracking-[0.12em] text-gold/50">Ad Spend Projections</span>
            <span className="text-[8px] text-muted-foreground/30 ml-auto">See what different spend levels could return</span>
          </div>

          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Slide to see projected leads, closes, and revenue at different monthly ad spend levels. Projections factor in your current scores for ads and sales.
          </p>

          {/* Spend Level Slider */}
          <div className="rounded-xl border border-border/15 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Monthly Ad Spend</span>
              <span className="font-data text-lg font-bold text-gold">{fmtFull(adSpendLevel)}/mo</span>
            </div>

            <input
              type="range"
              min={0}
              max={5000}
              step={100}
              value={adSpendLevel}
              onChange={(e) => setAdSpendLevel(parseInt(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #C8962E 0%, #C8962E ${(adSpendLevel / 5000) * 100}%, rgba(255,255,255,0.06) ${(adSpendLevel / 5000) * 100}%, rgba(255,255,255,0.06) 100%)`,
                accentColor: '#C8962E',
              }}
            />

            {/* Preset buttons */}
            <div className="flex gap-2 flex-wrap">
              {AD_SPEND_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setAdSpendLevel(preset)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all
                    ${adSpendLevel === preset
                      ? 'bg-gold/15 text-gold border border-gold/30'
                      : 'bg-muted/10 text-muted-foreground/50 border border-border/15 hover:border-gold/20 hover:text-foreground'
                    }
                  `}
                >
                  {preset === 0 ? '$0' : fmt(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Projection Results */}
          {adSpendLevel > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ProjectionCard
                label="Est. Leads/mo"
                value={adSpendProjection.totalExpectedLeads.toFixed(1)}
                sublabel={`${fmtFull(Math.round(adSpendProjection.blendedCPL))} per lead`}
                color="#3B82F6"
              />
              <ProjectionCard
                label="Est. Closes/mo"
                value={adSpendProjection.totalExpectedCloses.toFixed(1)}
                sublabel={`${adSpendProjection.blendedCloseRate.toFixed(0)}% close rate`}
                color="#8B5CF6"
              />
              <ProjectionCard
                label="Est. Revenue/mo"
                value={fmtFull(adSpendProjection.totalExpectedRevenue)}
                sublabel={`from ${fmtFull(adSpendLevel)} spend`}
                color="#2ECC71"
              />
              <ProjectionCard
                label="ROI"
                value={`${adSpendProjection.overallROI}%`}
                sublabel={`${fmtFull(Math.round(adSpendProjection.revenuePerDollarSpent * 100) / 100)} per $1 spent`}
                color={adSpendProjection.overallROI >= 200 ? '#2ECC71' : adSpendProjection.overallROI >= 100 ? '#8BC34A' : adSpendProjection.overallROI >= 0 ? '#D4A843' : '#E74C3C'}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border/15 bg-white/[0.02] p-6 text-center">
              <DollarSign size={24} className="text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/40">Move the slider above to see ad spend projections</p>
            </div>
          )}

          {/* Channel breakdown for non-zero spend */}
          {adSpendLevel > 0 && adSpendProjection.channelBreakdowns.length > 0 && (
            <div className="rounded-xl border border-border/10 bg-white/[0.02] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/10 bg-white/[0.02]">
                <span className="text-[9px] font-data font-bold text-muted-foreground/40 uppercase tracking-wider">Channel Breakdown</span>
              </div>
              <div className="divide-y divide-border/5">
                {adSpendProjection.channelBreakdowns.map(ch => (
                  <div key={ch.channel} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xs text-foreground/70 flex-1">{ch.channelLabel}</span>
                    <span className="font-data text-[10px] text-muted-foreground/40">{fmtFull(ch.monthlySpend)}</span>
                    <ArrowRight size={8} className="text-muted-foreground/20" />
                    <span className="font-data text-[10px] text-foreground/60">{ch.expectedLeads.toFixed(1)} leads</span>
                    <ArrowRight size={8} className="text-muted-foreground/20" />
                    <span className="font-data text-[10px] font-bold text-emerald-400">{fmtFull(ch.expectedRevenue)}</span>
                    <span className={`font-data text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ch.roi >= 200 ? 'bg-emerald-500/10 text-emerald-400' : ch.roi >= 100 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {ch.roi}% ROI
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── EXPLANATION ─── */}
        <div className="rounded-lg px-4 py-3 flex gap-3 items-start" style={{ backgroundColor: 'rgba(200,150,46,0.04)', border: '1px solid rgba(200,150,46,0.15)' }}>
          <Zap size={14} className="text-gold shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/70 leading-relaxed">
            <strong className="text-foreground/90">How this works:</strong> The probability engine uses a dependency-aware model that checks four prerequisites (CRM, team capacity, sales process, service delivery) before calculating your scaling probability. Your revenue ceiling is determined by the weakest of three factors: ad spend level, team capacity, and systems maturity. Improving one area without fixing the others won't move the needle — the algorithm knows what needs to change together.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Projection Card ───
function ProjectionCard({ label, value, sublabel, color }: { label: string; value: string; sublabel: string; color: string }) {
  return (
    <div className="rounded-xl border border-border/20 bg-white/[0.02] p-4 text-center">
      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="font-data text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-[9px] text-muted-foreground/30 mt-1">{sublabel}</div>
    </div>
  );
}
