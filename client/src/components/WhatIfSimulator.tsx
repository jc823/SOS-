/**
 * WhatIfSimulator — Interactive "What If" panel for the report
 * 
 * Lets users adjust individual subcategory scores and instantly see
 * how it impacts probability, revenue projection, and growth trajectory.
 * 
 * Design: Gold-accented HUD style matching the report aesthetic.
 */
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders, ChevronDown, ChevronUp, RotateCcw, TrendingUp,
  ArrowRight, Zap, Target, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PILLARS, computeSOS, computeScalingProbability,
  getBandColor, getProbabilityColor,
  type RevenueTier, type SubcategoryInput, type SOSResult, type ScalingProbability,
} from '@/lib/sos-engine';

interface WhatIfSimulatorProps {
  inputs: Record<string, SubcategoryInput>;
  originalResult: SOSResult;
  originalProbability: ScalingProbability;
  revenueTier: RevenueTier;
  customTarget?: number;
}

const PILLAR_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

export default function WhatIfSimulator({
  inputs,
  originalResult,
  originalProbability,
  revenueTier,
  customTarget,
}: WhatIfSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());

  // Build modified inputs from adjustments
  const modifiedInputs = useMemo(() => {
    const modified = { ...inputs };
    for (const [subId, newScore] of Object.entries(adjustments)) {
      if (modified[subId]) {
        modified[subId] = { ...modified[subId], score: newScore };
      }
    }
    return modified;
  }, [inputs, adjustments]);

  // Compute new results
  const modifiedResult = useMemo(() => computeSOS(modifiedInputs), [modifiedInputs]);
  const modifiedProbability = useMemo(
    () => computeScalingProbability(modifiedResult, revenueTier, customTarget),
    [modifiedResult, revenueTier, customTarget]
  );

  const hasChanges = Object.keys(adjustments).length > 0;
  const probDelta = modifiedProbability.overall - originalProbability.overall;
  const scoreDelta = modifiedResult.percentage - originalResult.percentage;

  const handleScoreChange = useCallback((subId: string, newScore: number) => {
    const originalScore = inputs[subId]?.score ?? 0;
    setAdjustments(prev => {
      if (newScore === originalScore) {
        const next = { ...prev };
        delete next[subId];
        return next;
      }
      return { ...prev, [subId]: newScore };
    });
  }, [inputs]);

  const handleReset = useCallback(() => {
    setAdjustments({});
  }, []);

  const togglePillar = (id: string) => {
    setExpandedPillars(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Find top 5 biggest impact improvements
  const topImprovements = useMemo(() => {
    if (!hasChanges) return [];
    return Object.entries(adjustments)
      .map(([subId, newScore]) => {
        const originalScore = inputs[subId]?.score ?? 0;
        const sub = originalResult.pillars.flatMap(p => p.subcategories).find(s => s.id === subId);
        return {
          id: subId,
          label: sub?.label || subId,
          pillarLabel: sub?.pillarLabel || '',
          from: originalScore,
          to: newScore,
          delta: newScore - originalScore,
        };
      })
      .filter(i => i.delta !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5);
  }, [adjustments, inputs, originalResult, hasChanges]);

  return (
    <div className="rounded-2xl border border-border/20 bg-card relative overflow-hidden">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/20" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/20" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/20" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/20" />

      {/* Header — always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 sm:p-6 flex items-center gap-4 hover:bg-white/[0.01] transition-colors"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative shrink-0"
          style={{ backgroundColor: 'rgba(200,150,46,0.08)', border: '1px solid rgba(200,150,46,0.15)' }}>
          <Sliders size={18} className="text-gold" />
          <div className="absolute inset-0 rounded-xl animate-pulse" style={{ boxShadow: '0 0 15px rgba(200,150,46,0.1)' }} />
        </div>
        <div className="flex-1 text-left">
          <h2 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-[0.1em]">
            What-If Simulator
          </h2>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            Adjust scores to see how improvements impact your scaling probability
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2">
              <span className={`font-data text-sm font-bold ${probDelta > 0 ? 'text-emerald-400' : probDelta < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {probDelta > 0 ? '+' : ''}{probDelta.toFixed(1)}%
              </span>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gold/30 animate-pulse" />
            <span className="font-data text-[8px] text-gold/30 uppercase tracking-widest">Interactive</span>
          </div>
          {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-6 space-y-5">
              {/* Delta Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DeltaCard
                  label="Overall Score"
                  original={originalResult.percentage}
                  modified={modifiedResult.percentage}
                  suffix="%"
                  color={getBandColor(modifiedResult.band)}
                />
                <DeltaCard
                  label="Probability"
                  original={originalProbability.overall}
                  modified={modifiedProbability.overall}
                  suffix="%"
                  color={getProbabilityColor(modifiedProbability.overall)}
                />
                <DeltaCard
                  label="Changes Made"
                  original={0}
                  modified={Object.keys(adjustments).length}
                  suffix=""
                  color="#C8962E"
                  hideDelta
                />
                <div className="rounded-xl border border-border/20 bg-white/[0.02] p-3 flex flex-col items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={!hasChanges}
                    className="h-7 text-[10px] gap-1 border-border/30 hover:border-gold/40 hover:text-gold disabled:opacity-30"
                  >
                    <RotateCcw size={10} />
                    Reset All
                  </Button>
                </div>
              </div>

              {/* Top Improvements Summary */}
              {hasChanges && topImprovements.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Simulated Changes</span>
                  </div>
                  <div className="space-y-1.5">
                    {topImprovements.map(imp => (
                      <div key={imp.id} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground/60 w-20 truncate">{imp.pillarLabel}</span>
                        <span className="text-foreground/80 flex-1 truncate">{imp.label}</span>
                        <span className="font-data text-muted-foreground">{imp.from}</span>
                        <ArrowRight size={10} className="text-gold/50" />
                        <span className={`font-data font-bold ${imp.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {imp.to}
                        </span>
                      </div>
                    ))}
                  </div>
                  {probDelta !== 0 && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-center gap-2">
                      <TrendingUp size={12} className={probDelta > 0 ? 'text-emerald-400' : 'text-red-400'} />
                      <span className="text-xs text-foreground/70">
                        These changes would move your scaling probability from{' '}
                        <strong className="text-foreground">{originalProbability.overall.toFixed(1)}%</strong>
                        {' '}to{' '}
                        <strong className={probDelta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {modifiedProbability.overall.toFixed(1)}%
                        </strong>
                        {' '}({probDelta > 0 ? '+' : ''}{probDelta.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Pillar Score Adjusters */}
              <div className="space-y-2">
                {PILLARS.map((pillar, pi) => {
                  const pillarColor = PILLAR_COLORS[pi];
                  const isExpanded = expandedPillars.has(pillar.id);
                  const changesInPillar = pillar.subcategories.filter(s => adjustments[s.id] !== undefined).length;

                  return (
                    <div key={pillar.id} className="rounded-xl border border-border/15 bg-white/[0.02] overflow-hidden">
                      <button
                        onClick={() => togglePillar(pillar.id)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.01] transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pillarColor }} />
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex-1 text-left">
                          {pillar.label}
                        </span>
                        {changesInPillar > 0 && (
                          <span className="text-[9px] font-data text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
                            {changesInPillar} changed
                          </span>
                        )}
                        {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 pb-3 space-y-2">
                              {pillar.subcategories.map(sub => {
                                const originalScore = inputs[sub.id]?.score ?? 0;
                                const currentScore = adjustments[sub.id] ?? originalScore;
                                const isModified = adjustments[sub.id] !== undefined;

                                return (
                                  <div key={sub.id} className={`rounded-lg p-3 transition-colors ${isModified ? 'bg-gold/[0.04] border border-gold/15' : 'bg-white/[0.01] border border-transparent'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex-1 min-w-0">
                                        <span className="text-xs text-foreground/80 block truncate">{sub.label}</span>
                                        {isModified && (
                                          <span className="text-[9px] text-gold/70">
                                            was {originalScore} → now {currentScore}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {[0, 1, 2, 3, 4, 5].map(score => {
                                        const isActive = score === currentScore;
                                        const isOriginal = score === originalScore && isModified;
                                        const color = score >= 4 ? '#2ECC71' : score >= 3 ? '#8BC34A' : score >= 2 ? '#D4A843' : score >= 1 ? '#E67E22' : '#E74C3C';

                                        return (
                                          <button
                                            key={score}
                                            onClick={() => handleScoreChange(sub.id, score)}
                                            className={`
                                              flex-1 h-7 rounded text-[10px] font-data font-bold transition-all relative
                                              ${isActive
                                                ? 'text-black shadow-sm'
                                                : 'text-muted-foreground/50 hover:text-foreground/70'
                                              }
                                            `}
                                            style={{
                                              backgroundColor: isActive ? color : 'rgba(255,255,255,0.03)',
                                              border: isOriginal && !isActive ? `1px dashed ${color}40` : isActive ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                            }}
                                          >
                                            {score}
                                            {isOriginal && !isActive && (
                                              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-gold" />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Insight */}
              {!hasChanges && (
                <div className="rounded-lg px-4 py-3 flex gap-3 items-start" style={{ backgroundColor: 'rgba(200,150,46,0.04)', border: '1px solid rgba(200,150,46,0.15)' }}>
                  <Target size={14} className="text-gold shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground/70 leading-relaxed">
                    <strong className="text-foreground/90">How to use:</strong> Expand a pillar above and click on score buttons to simulate improvements. 
                    The dashboard at the top will instantly show how your changes affect the overall score and scaling probability. 
                    This helps you prioritize which areas to improve first for maximum impact.
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Delta Card ───
function DeltaCard({
  label, original, modified, suffix, color, hideDelta = false,
}: {
  label: string; original: number; modified: number; suffix: string; color: string; hideDelta?: boolean;
}) {
  const delta = modified - original;
  return (
    <div className="rounded-xl border border-border/20 bg-white/[0.02] p-3 text-center">
      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-data text-lg font-bold" style={{ color }}>
        {modified.toFixed(suffix === '%' ? 1 : 0)}{suffix}
      </div>
      {!hideDelta && delta !== 0 && (
        <div className={`text-[10px] font-data font-bold mt-0.5 ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}{suffix}
        </div>
      )}
    </div>
  );
}
