/**
 * ConsultationPillarCard — Streamlined pillar card for sales call mode
 * Shows pillar name, simplified 3-level scoring, and a big visual score indicator.
 * No rubric details, no notes, no weights — just quick scoring.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Wrench, Phone, Megaphone, Users } from 'lucide-react';
import { getBandColor } from '@/lib/sos-engine';
import type { PillarDef, PillarResult, SubcategoryInput } from '@/lib/sos-engine';
import ConsultationScoreInput from './ConsultationScoreInput';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Wrench, Phone, Megaphone, Users,
};

// Friendly pillar descriptions for sales calls
const PILLAR_DESCRIPTIONS: Record<string, string> = {
  services: 'How well your services are structured, priced, and delivered',
  sales: 'Your ability to convert leads, retain customers, and grow revenue',
  ads: 'How effectively you attract new customers through marketing',
  team: 'The strength, training, and culture of your team',
};

interface ConsultationPillarCardProps {
  pillar: PillarDef;
  pillarResult: PillarResult | null;
  inputs: Record<string, SubcategoryInput>;
  onScoreChange: (subId: string, score: number, note: string) => void;
  defaultExpanded?: boolean;
  allExpanded?: boolean;
}

export default function ConsultationPillarCard({
  pillar,
  pillarResult,
  inputs,
  onScoreChange,
  defaultExpanded = true,
  allExpanded,
}: ConsultationPillarCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (allExpanded !== undefined) setExpanded(allExpanded);
  }, [allExpanded]);

  const Icon = ICONS[pillar.icon] || Wrench;
  const pct = pillarResult?.percentage ?? 0;
  const band = pillarResult?.band || 'red';
  const bandColor = pillarResult ? getBandColor(band) : 'oklch(0.40 0.01 260)';
  const scoredCount = pillar.subcategories.filter(s => (inputs[s.id]?.score || 0) > 0).length;
  const totalCount = pillar.subcategories.length;

  return (
    <div className="rounded-2xl border border-border/30 bg-card overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${bandColor}15`, border: `1px solid ${bandColor}25` }}
        >
          <span style={{ color: bandColor }}><Icon size={22} /></span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground">{pillar.label}</h3>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {PILLAR_DESCRIPTIONS[pillar.id] || pillar.label}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {pillarResult && (
            <div className="text-right">
              <span className="font-data text-2xl font-bold" style={{ color: bandColor }}>
                {pct.toFixed(0)}%
              </span>
              <p className="text-[10px] text-muted-foreground/40">{scoredCount}/{totalCount} scored</p>
            </div>
          )}
          {expanded ? <ChevronUp size={18} className="text-muted-foreground/40" /> : <ChevronDown size={18} className="text-muted-foreground/40" />}
        </div>
      </button>

      {/* Progress bar */}
      {pillarResult && (
        <div className="h-1 bg-white/[0.03]">
          <motion.div
            className="h-full rounded-r-full"
            style={{ backgroundColor: bandColor }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Subcategories */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {pillar.subcategories.map((sub) => (
                <ConsultationScoreInput
                  key={sub.id}
                  subId={sub.id}
                  label={sub.label}
                  hint={sub.hint}
                  value={inputs[sub.id]?.score || 0}
                  note={inputs[sub.id]?.note || ''}
                  onChange={(score, note) => onScoreChange(sub.id, score, note)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
