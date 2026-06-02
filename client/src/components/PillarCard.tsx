/*
 * PillarCard v4 — Expandable pillar section with subcategory scoring
 * Now includes inline business profile fields relevant to each pillar.
 * Weights are hidden. Shows percentage-based pillar score.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Wrench, Phone, Megaphone, Users } from 'lucide-react';
import { getBandColor, getBandLabel } from '@/lib/sos-engine';
import type { PillarDef, PillarResult, SubcategoryInput } from '@/lib/sos-engine';
import type { BusinessProfile } from '@shared/business-profile';
import ScoreInput from './ScoreInput';
// PillarProfileFields shelved

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Wrench, Phone, Megaphone, Users,
};

interface PillarCardProps {
  pillar: PillarDef;
  pillarResult: PillarResult | null;
  inputs: Record<string, SubcategoryInput>;
  onScoreChange: (subId: string, score: number, note: string) => void;
  defaultExpanded?: boolean;
  allExpanded?: boolean;
  previousScores?: Record<string, { score: number; note: string }> | null;
  businessProfile?: BusinessProfile;
  onBusinessProfileChange?: (profile: BusinessProfile) => void;
}

export default function PillarCard({
  pillar,
  pillarResult,
  inputs,
  onScoreChange,
  defaultExpanded = false,
  allExpanded,
  previousScores,
  businessProfile,
  onBusinessProfileChange,
}: PillarCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (allExpanded !== undefined) setExpanded(allExpanded);
  }, [allExpanded]);

  const Icon = ICONS[pillar.icon] || Wrench;
  const band = pillarResult?.band || 'red';
  const bandColor = pillarResult ? getBandColor(band) : 'oklch(0.40 0.01 260)';
  const pct = pillarResult?.percentage ?? 0;
  const scoredCount = pillar.subcategories.filter(s => (inputs[s.id]?.score || 0) > 0).length;

  const hasProfileFields = businessProfile && onBusinessProfileChange &&
    ['services', 'sales', 'ads', 'team'].includes(pillar.id);

  return (
    <div className="glass-card overflow-hidden transition-all">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-white/[0.04] transition-colors"
      >
        <div
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${bandColor}15`, border: `1px solid ${bandColor}30`, color: bandColor }}
        >
          <Icon size={18} className="text-current" />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide">
              {pillar.label}
            </h3>
            {pillarResult && (
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${bandColor}18`, color: bandColor }}
              >
                {getBandLabel(band)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {pillar.subcategories.length} items · {scoredCount} scored
          </p>
        </div>

        {/* Score display */}
        <div className="shrink-0 text-right mr-2">
          <span className="font-data text-xl sm:text-2xl font-bold" style={{ color: bandColor }}>
            {pct > 0 ? `${pct.toFixed(0)}` : '—'}
          </span>
          <span className="font-data text-xs text-muted-foreground">%</span>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-3 sm:px-5 py-4 space-y-3">
              {/* PillarProfileFields shelved */}

              {/* Subcategory scoring inputs */}
              {pillar.subcategories.map((sub) => (
                <ScoreInput
                  key={sub.id}
                  label={sub.label}
                  weight={sub.weight}
                  hint={sub.hint}
                  rubric={sub.rubric}
                  value={inputs[sub.id]?.score || 0}
                  note={inputs[sub.id]?.note || ''}
                  onChange={(score, note) => onScoreChange(sub.id, score, note)}
                  previousScore={previousScores?.[sub.id]?.score ?? null}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
