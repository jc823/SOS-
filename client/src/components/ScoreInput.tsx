/*
 * ScoreInput v3 — Mobile-first score selector with rubric hints
 * Shows inline hint labels on each score button + expandable full rubric.
 * Weight is HIDDEN from the assessor.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { RubricLevel } from '@/lib/sos-engine';

interface ScoreInputProps {
  label: string;
  weight: number; // used internally but NOT displayed
  hint: string;
  rubric: RubricLevel[];
  value: number;
  note: string;
  onChange: (score: number, note: string) => void;
  previousScore?: number | null; // For reassessment mode
}

const SCORE_COLORS: Record<number, string> = {
  0: 'bg-[#E74C3C] border-[#E74C3C] text-white',
  1: 'bg-[#E67E22] border-[#E67E22] text-white',
  2: 'bg-[#D4A843] border-[#D4A843] text-black',
  3: 'bg-[#8BC34A] border-[#8BC34A] text-black',
  4: 'bg-[#4CAF50] border-[#4CAF50] text-white',
  5: 'bg-[#2ECC71] border-[#2ECC71] text-white',
};

const SCORE_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Poor',
  2: 'Below Avg',
  3: 'Average',
  4: 'Good',
  5: 'Elite',
};

export default function ScoreInput({ label, hint, rubric, value, note, onChange, previousScore }: ScoreInputProps) {
  const [showNote, setShowNote] = useState(!!note);
  const [showRubric, setShowRubric] = useState(false);
  const [touched, setTouched] = useState(value > 0);

  const handleScoreClick = (seg: number) => {
    setTouched(true);
    onChange(seg, note);
  };

  return (
    <div className="group rounded-lg border border-border/60 bg-card/50 p-3 sm:p-4 transition-all hover:border-gold/30 hover:bg-card/80">
      {/* Row 1: Label + hint */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-semibold text-foreground leading-tight">
            {label}
          </h4>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">
            {hint}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowRubric(!showRubric)}
            className={`p-1.5 rounded transition-colors ${
              showRubric ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="View grading rubric"
          >
            <HelpCircle size={16} />
          </button>
          <button
            onClick={() => setShowNote(!showNote)}
            className={`p-1.5 rounded transition-colors ${
              showNote || note ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Add note"
          >
            {showNote ? <X size={16} /> : <MessageSquare size={16} />}
          </button>
        </div>
      </div>

      {/* Previous score badge for reassessment */}
      {previousScore !== undefined && previousScore !== null && (
        <div className="flex items-center gap-2 mt-2 mb-1">
          <span className="text-[10px] text-muted-foreground">Previous score:</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
            previousScore <= 1 ? 'bg-[#E74C3C]/15 text-[#E74C3C]' :
            previousScore <= 2 ? 'bg-[#D4A843]/15 text-[#D4A843]' :
            previousScore <= 3 ? 'bg-[#8BC34A]/15 text-[#8BC34A]' :
            'bg-[#2ECC71]/15 text-[#2ECC71]'
          }`}>
            {previousScore}/5 · {SCORE_LABELS[previousScore]}
          </span>
          {touched && value !== previousScore && (
            <span className={`text-[10px] font-semibold ${
              value > previousScore ? 'text-[#2ECC71]' : 'text-[#E74C3C]'
            }`}>
              {value > previousScore ? `▲ +${value - previousScore}` : `▼ ${value - previousScore}`}
            </span>
          )}
        </div>
      )}

      {/* Row 2: Score buttons with labels */}
      <div className="grid grid-cols-6 gap-1 sm:gap-1.5 mt-2.5">
        {[0, 1, 2, 3, 4, 5].map((seg) => {
          const isActive = touched && seg === value;
          return (
            <button
              key={seg}
              onClick={() => handleScoreClick(seg)}
              className={`
                relative flex flex-col items-center justify-center gap-0.5
                h-12 sm:h-11 rounded-md
                border transition-all duration-150
                ${isActive
                  ? `${SCORE_COLORS[seg]} shadow-sm`
                  : 'border-border/40 bg-muted/30 text-muted-foreground hover:border-gold/40 hover:text-foreground'
                }
              `}
            >
              <span className="font-data text-sm sm:text-xs font-bold leading-none">{seg}</span>
              <span className={`text-[8px] sm:text-[7px] leading-none font-medium ${isActive ? 'opacity-90' : 'opacity-60'}`}>
                {SCORE_LABELS[seg]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Row 3: Active score description hint */}
      {touched && rubric[value] && (
        <div className="mt-2 px-2 py-1.5 rounded bg-muted/20 border border-border/20">
          <p className="text-[11px] text-muted-foreground leading-snug">
            <span className="font-semibold text-foreground">{rubric[value].label}:</span>{' '}
            {rubric[value].description}
          </p>
        </div>
      )}

      {/* Expandable full rubric guide */}
      <AnimatePresence>
        {showRubric && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-lg border border-gold/20 bg-gold/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-gold">
                  Grading Rubric
                </h5>
                <button onClick={() => setShowRubric(false)} className="text-muted-foreground hover:text-foreground">
                  <ChevronUp size={14} />
                </button>
              </div>
              {rubric.map((level) => (
                <div
                  key={level.score}
                  className={`flex gap-2 rounded p-2 transition-colors ${
                    touched && level.score === value
                      ? 'bg-gold/10 border border-gold/20'
                      : 'border border-transparent'
                  }`}
                >
                  <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono ${
                    touched && level.score === value
                      ? SCORE_COLORS[level.score]
                      : 'bg-muted/30 text-muted-foreground'
                  }`}>
                    {level.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-foreground">{level.label}</span>
                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                      {level.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note input */}
      <AnimatePresence>
        {showNote && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <input
              type="text"
              value={note}
              onChange={(e) => onChange(value, e.target.value)}
              placeholder="Add a note about this area..."
              className="w-full mt-2.5 rounded border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
