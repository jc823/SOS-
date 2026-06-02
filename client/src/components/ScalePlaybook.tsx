/**
 * ScalePlaybook — AI-powered "What Scale Would Do" branded recommendation section
 * 
 * Mobile-first design. Generates a branded playbook using LLM with Scale's methodology.
 * Sections: Executive Diagnosis, Top 5 Priority Moves, Revenue Timeline, Cost of Waiting
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, ChevronUp, Clock, DollarSign, AlertTriangle, Target, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import type { SubcategoryInput, RevenueTier } from '@/lib/sos-engine';

interface ScalePlaybookProps {
  scores: Record<string, SubcategoryInput>;
  revenueTier: RevenueTier;
  overallPercentage: number;
  scalingProbability: number;
  shopName: string;
  assessmentId?: number;
}

interface PlaybookData {
  executiveDiagnosis: string;
  prescriptions: {
    title: string;
    description: string;
    timeframe: string;
    revenueImpact: string;
    subcategoryId: string;
  }[];
  revenueTimeline: {
    day30: string;
    day60: string;
    day90: string;
  };
  costOfWaiting: string;
  guaranteeStatement: string;
}

export default function ScalePlaybook({
  scores,
  revenueTier,
  overallPercentage,
  scalingProbability,
  shopName,
  assessmentId,
}: ScalePlaybookProps) {
  const [playbook, setPlaybook] = useState<PlaybookData | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = trpc.actionPlan.generateScalePlaybook.useMutation({
    onSuccess: (data: any) => {
      setPlaybook(data);
      setError(null);
    },
    onError: (err: any) => {
      setError('Failed to generate playbook. Please try again.');
      console.error('[ScalePlaybook] Error:', err);
    },
  });

  const handleGenerate = () => {
    setError(null);
    generateMutation.mutate({
      scores,
      revenueTier,
      overallPercentage,
      scalingProbability,
      shopName,
      assessmentId,
    });
  };

  const isLoading = generateMutation.isPending;

  // ─── Not Generated Yet ───
  if (!playbook && !isLoading) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#C8962E]/30 bg-[#C8962E]/5 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#C8962E]/10 flex items-center justify-center shrink-0">
            <Zap size={20} className="text-[#C8962E] sm:hidden" />
            <Zap size={24} className="text-[#C8962E] hidden sm:block" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-foreground">Scale's Playbook</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              AI-generated strategic recommendations using Scale Detailing's proven methodology
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-[#C8962E] text-black hover:bg-[#D4A843] h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-bold w-full sm:w-auto"
          >
            <Zap size={14} className="mr-1.5" />
            Generate Playbook
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-3">{error}</p>
        )}
      </div>
    );
  }

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#C8962E]/20 bg-[#C8962E]/5 p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center gap-3 py-4 sm:py-8">
          <Loader2 size={28} className="text-[#C8962E] animate-spin sm:hidden" />
          <Loader2 size={32} className="text-[#C8962E] animate-spin hidden sm:block" />
          <p className="text-xs sm:text-sm font-bold text-[#C8962E]">Generating Scale's Playbook...</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center max-w-xs">
            Analyzing scores and building a custom strategy using Scale's proven methodology
          </p>
        </div>
      </div>
    );
  }

  // ─── Playbook Generated ───
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#C8962E]/10 flex items-center justify-center">
            <Zap size={16} className="text-[#C8962E]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">Scale's Playbook</h3>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">AI-powered strategic recommendations</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenerate}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground h-7 sm:h-8 text-[10px] sm:text-xs gap-1"
        >
          <RefreshCw size={12} />
          Regenerate
        </Button>
      </div>

      {/* Executive Diagnosis */}
      {playbook?.executiveDiagnosis && (
        <div className="glass-card p-3 sm:p-4">
          <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#C8962E] mb-2">
            Executive Diagnosis
          </h4>
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
            {playbook.executiveDiagnosis}
          </p>
        </div>
      )}

      {/* Top Prescriptions */}
      {playbook?.prescriptions && playbook.prescriptions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Scale's Top {playbook.prescriptions.length} Moves
          </h4>
          {playbook.prescriptions.map((rx, i) => {
            const isExpanded = expandedIdx === i;
            return (
              <motion.div
                key={i}
                className="glass-card overflow-hidden"
                layout
              >
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  className="w-full flex items-start gap-2 sm:gap-3 p-3 sm:p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#C8962E]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] sm:text-xs font-bold text-[#C8962E]">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">{rx.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                      {rx.timeframe && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] text-muted-foreground">
                          <Clock size={9} />
                          {rx.timeframe}
                        </span>
                      )}
                      {rx.revenueImpact && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] text-emerald-400">
                          <DollarSign size={9} />
                          {rx.revenueImpact}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                        <div className="pl-8 sm:pl-10 border-l-2 border-[#C8962E]/20 ml-0.5">
                          <p className="text-[10px] sm:text-xs text-foreground/70 leading-relaxed">
                            {rx.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Revenue Timeline */}
      {playbook?.revenueTimeline && (
        <div className="glass-card p-3 sm:p-4">
          <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Revenue Projection
          </h4>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: '30 Days', value: playbook.revenueTimeline.day30, color: '#3B82F6' },
              { label: '60 Days', value: playbook.revenueTimeline.day60, color: '#8B5CF6' },
              { label: '90 Days', value: playbook.revenueTimeline.day90, color: '#2ECC71' },
            ].map((t) => (
              <div key={t.label} className="text-center p-2 sm:p-3 rounded-lg bg-muted/10">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t.label}</p>
                <p className="text-[10px] sm:text-sm font-bold break-words" style={{ color: t.color }}>{t.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost of Waiting */}
      {playbook?.costOfWaiting && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-400 mb-1">
                Cost of Waiting
              </h4>
              <p className="text-[10px] sm:text-xs text-foreground/70 leading-relaxed">
                {playbook.costOfWaiting}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Guarantee */}
      {playbook?.guaranteeStatement && (
        <div className="rounded-xl border border-[#C8962E]/20 bg-[#C8962E]/5 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <Target size={14} className="text-[#C8962E] shrink-0 mt-0.5" />
            <p className="text-[10px] sm:text-xs text-foreground/70 leading-relaxed italic">
              {playbook.guaranteeStatement}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
