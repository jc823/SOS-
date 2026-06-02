/**
 * ConsultationScoreInput — Sales-call scoring with real-world descriptions
 * 
 * 3 levels: Needs Work (1), Okay (3), Strong (5)
 * Each level shows a relatable description so the customer immediately
 * recognizes their own situation and sees the gap.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, MinusCircle, CheckCircle2 } from 'lucide-react';
import { getConsultationDesc } from '@/lib/consultation-descriptions';

interface ConsultationScoreInputProps {
  label: string;
  hint: string;
  subId: string;
  value: number;
  onChange: (score: number, note: string) => void;
  note: string;
}

const LEVELS = [
  {
    score: 1,
    label: 'Needs Work',
    Icon: AlertTriangle,
    color: '#E74C3C',
    bg: 'rgba(231,76,60,0.08)',
    bgActive: 'rgba(231,76,60,0.15)',
    border: 'rgba(231,76,60,0.20)',
    borderActive: 'rgba(231,76,60,0.50)',
    descKey: 'needsWork' as const,
  },
  {
    score: 3,
    label: 'Okay',
    Icon: MinusCircle,
    color: '#D4A843',
    bg: 'rgba(212,168,67,0.08)',
    bgActive: 'rgba(212,168,67,0.15)',
    border: 'rgba(212,168,67,0.20)',
    borderActive: 'rgba(212,168,67,0.50)',
    descKey: 'okay' as const,
  },
  {
    score: 5,
    label: 'Strong',
    Icon: CheckCircle2,
    color: '#2ECC71',
    bg: 'rgba(46,204,113,0.08)',
    bgActive: 'rgba(46,204,113,0.15)',
    border: 'rgba(46,204,113,0.20)',
    borderActive: 'rgba(46,204,113,0.50)',
    descKey: 'strong' as const,
  },
];

export default function ConsultationScoreInput({
  label,
  hint,
  subId,
  value,
  onChange,
  note,
}: ConsultationScoreInputProps) {
  const [showDetails, setShowDetails] = useState(false);
  const activeLevel = value <= 0 ? null : value <= 2 ? 1 : value <= 4 ? 3 : 5;
  const desc = getConsultationDesc(subId);

  return (
    <div className="glass-card/80 overflow-hidden transition-all">
      {/* Question Header */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-semibold text-foreground leading-snug">
            {desc.question}
          </h4>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">{label}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {activeLevel && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                color: LEVELS.find(l => l.score === activeLevel)?.color,
                backgroundColor: LEVELS.find(l => l.score === activeLevel)?.bgActive,
              }}
            >
              {LEVELS.find(l => l.score === activeLevel)?.label}
            </span>
          )}
          {showDetails ? (
            <ChevronUp size={16} className="text-muted-foreground/40" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground/40" />
          )}
        </div>
      </button>

      {/* Scoring Cards */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {LEVELS.map((level) => {
                const isActive = activeLevel === level.score;
                const LevelIcon = level.Icon;
                return (
                  <motion.button
                    key={level.score}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChange(level.score, note)}
                    className="w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all"
                    style={{
                      backgroundColor: isActive ? level.bgActive : level.bg,
                      borderColor: isActive ? level.borderActive : level.border,
                      boxShadow: isActive ? `0 0 16px ${level.bg}` : 'none',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: isActive ? `${level.color}20` : 'transparent',
                      }}
                    >
                      <LevelIcon
                        size={18}
                        style={{
                          color: isActive ? level.color : `${level.color}60`,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-sm font-bold"
                          style={{ color: isActive ? level.color : `${level.color}90` }}
                        >
                          {level.label}
                        </span>
                        {isActive && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              color: level.color,
                              backgroundColor: `${level.color}15`,
                            }}
                          >
                            Selected
                          </motion.span>
                        )}
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{
                          color: isActive
                            ? 'rgba(255,255,255,0.85)'
                            : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        {desc[level.descKey]}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Score Dots (when collapsed and unscored) */}
      {!showDetails && !activeLevel && (
        <div className="px-4 pb-3 flex gap-2">
          {LEVELS.map((level) => (
            <button
              key={level.score}
              onClick={(e) => {
                e.stopPropagation();
                onChange(level.score, note);
              }}
              className="flex-1 py-2.5 rounded-lg border text-center transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: level.bg,
                borderColor: level.border,
              }}
            >
              <span className="text-xs font-bold" style={{ color: level.color }}>
                {level.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
