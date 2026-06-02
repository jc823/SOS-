/**
 * PresenterMode — Full-screen dramatic consultation presentation
 * 
 * Mobile-first design: works perfectly on phones (375px+), tablets, and desktop.
 * Designed for live sales calls — one subcategory at a time with dramatic scoring.
 * 
 * Flow: Intro → Pillar-by-pillar scoring → Final Reveal
 * Each subcategory gets 3 options: "That's Us" (1), "We're Getting There" (3), "We've Got This Handled" (5)
 * Live probability HUD updates in real-time.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, AlertTriangle, Shield, BarChart3, Activity, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PILLARS, computeSOS, computeScalingProbability, ALL_SUBCATEGORY_IDS } from '@/lib/sos-engine';
import { CONSULTATION_DESCRIPTIONS } from '@/lib/consultation-descriptions';
import type { SubcategoryInput, SOSResult, RevenueTier, ScalingProbability } from '@/lib/sos-engine';

const PILLAR_ICONS = [Shield, BarChart3, Activity, Layers];
const PILLAR_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

interface PresenterModeProps {
  inputs: Record<string, SubcategoryInput>;
  onInputChange: (subId: string, score: number, note: string) => void;
  revenueTier: RevenueTier;
  customTarget?: number;
  totalAdSpend?: number;
  marketData?: any;
  onExit: () => void;
  shopName: string;
}

function buildQuestionList() {
  const questions: {
    pillarId: string;
    pillarName: string;
    pillarIndex: number;
    pillarColor: string;
    subId: string;
    subName: string;
    subIndex: number;
    totalInPillar: number;
  }[] = [];

  PILLARS.forEach((pillar, pi) => {
    pillar.subcategories.forEach((sub, si) => {
      questions.push({
        pillarId: pillar.id,
        pillarName: pillar.label,
        pillarIndex: pi,
        pillarColor: PILLAR_COLORS[pi],
        subId: sub.id,
        subName: sub.label,
        subIndex: si,
        totalInPillar: pillar.subcategories.length,
      });
    });
  });

  return questions;
}

const SCORE_OPTIONS = [
  {
    score: 1,
    label: "That's Us",
    sublabel: 'Needs serious work',
    color: '#E74C3C',
    bgClass: 'from-red-500/20 to-red-900/10 border-red-500/40',
    emoji: '⚠️',
  },
  {
    score: 3,
    label: "We're Getting There",
    sublabel: 'Making progress',
    color: '#D4A843',
    bgClass: 'from-yellow-500/20 to-yellow-900/10 border-yellow-500/40',
    emoji: '📈',
  },
  {
    score: 5,
    label: "We've Got This",
    sublabel: 'Dialed in',
    color: '#2ECC71',
    bgClass: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/40',
    emoji: '✅',
  },
];

export default function PresenterMode({
  inputs,
  onInputChange,
  revenueTier,
  customTarget,
  totalAdSpend,
  marketData,
  onExit,
  shopName,
}: PresenterModeProps) {
  const questions = useMemo(() => buildQuestionList(), []);
  const [phase, setPhase] = useState<'intro' | 'scoring' | 'pillar-transition' | 'final'>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [animatingScore, setAnimatingScore] = useState(false);
  const [lastScoredValue, setLastScoredValue] = useState<number | null>(null);

  const result: SOSResult = useMemo(() => computeSOS(inputs), [inputs]);
  const scoredCount = useMemo(() => {
    return Object.values(inputs).filter(i => i.score > 0).length;
  }, [inputs]);

  const probability: ScalingProbability | null = useMemo(() => {
    if (scoredCount === 0) return null;
    return computeScalingProbability(
      result, revenueTier,
      revenueTier === 'custom' ? customTarget : undefined,
      totalAdSpend, inputs, marketData
    );
  }, [result, scoredCount, revenueTier, customTarget, totalAdSpend, inputs, marketData]);

  const currentQ = questions[questionIndex];
  const isLastQuestion = questionIndex >= questions.length - 1;

  const prevPillarIndex = questionIndex > 0 ? questions[questionIndex - 1]?.pillarIndex : -1;
  const isNewPillar = currentQ && currentQ.pillarIndex !== prevPillarIndex && phase === 'scoring';

  useEffect(() => {
    if (isNewPillar && questionIndex > 0 && phase === 'scoring') {
      setPhase('pillar-transition');
      const timer = setTimeout(() => setPhase('scoring'), 2200);
      return () => clearTimeout(timer);
    }
  }, [questionIndex]);

  const handleScore = useCallback((score: number) => {
    if (!currentQ || animatingScore) return;
    setAnimatingScore(true);
    setLastScoredValue(score);

    if (score <= 1) setAlertCount(prev => prev + 1);

    onInputChange(currentQ.subId, score, inputs[currentQ.subId]?.note || '');

    setTimeout(() => {
      setAnimatingScore(false);
      setLastScoredValue(null);
      if (isLastQuestion) {
        setPhase('final');
      } else {
        setQuestionIndex(prev => prev + 1);
      }
    }, 800);
  }, [currentQ, animatingScore, isLastQuestion, onInputChange, inputs]);

  const handleBack = useCallback(() => {
    if (questionIndex > 0) {
      setQuestionIndex(prev => prev - 1);
    }
  }, [questionIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'intro') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setPhase('scoring');
        }
        return;
      }
      if (phase === 'pillar-transition') return;
      if (phase === 'final') {
        if (e.key === 'Escape') onExit();
        return;
      }
      if (phase === 'scoring' && !animatingScore) {
        if (e.key === '1') handleScore(1);
        else if (e.key === '2' || e.key === '3') handleScore(3);
        else if (e.key === '4' || e.key === '5') handleScore(5);
        else if (e.key === 'ArrowLeft' || e.key === 'Backspace') handleBack();
      }
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, animatingScore, handleScore, handleBack, onExit]);

  const getDescription = (subId: string, score: number) => {
    const desc = CONSULTATION_DESCRIPTIONS[subId];
    if (!desc) return '';
    if (score === 1) return desc.needsWork || '';
    if (score === 3) return desc.okay || '';
    if (score === 5) return desc.strong || '';
    return '';
  };

  // ─── INTRO SCREEN ───
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 sm:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/40 hover:text-white z-50 h-8 w-8 p-0"
        >
          <X size={18} />
        </Button>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-lg w-full"
        >
          <motion.img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
            alt="Scale Detailing"
            className="h-10 sm:h-14 w-auto mx-auto mb-6 sm:mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">
              Scale Operating System
            </h1>
            <p className="text-sm sm:text-lg text-white/50 mb-1">Business Assessment for</p>
            <p className="text-xl sm:text-3xl font-bold text-[#C8962E] mb-6 sm:mb-8 break-words px-2">
              {shopName || 'Your Shop'}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-xs mx-auto">
              {PILLARS.map((p, i) => {
                const Icon = PILLAR_ICONS[i];
                return (
                  <div key={p.id} className="flex items-center gap-1.5 sm:gap-2 text-white/40">
                    <Icon size={14} style={{ color: PILLAR_COLORS[i] }} />
                    <span className="text-xs sm:text-sm">{p.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] sm:text-xs text-white/25">
              {ALL_SUBCATEGORY_IDS.length} areas · 4 pillars · ~10 minutes
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
            <Button
              onClick={() => setPhase('scoring')}
              className="bg-[#C8962E] text-black hover:bg-[#D4A843] h-11 sm:h-12 px-8 sm:px-10 text-sm sm:text-base font-bold w-full sm:w-auto"
            >
              Begin Assessment
              <ChevronRight size={18} className="ml-1" />
            </Button>
            <p className="text-[9px] sm:text-[10px] text-white/20 mt-3 hidden sm:block">
              Press Enter or Space to begin · ESC to exit
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ─── PILLAR TRANSITION SCREEN ───
  if (phase === 'pillar-transition' && currentQ) {
    const PIcon = PILLAR_ICONS[currentQ.pillarIndex];
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`pillar-${currentQ.pillarIndex}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto mb-4 sm:mb-6 flex items-center justify-center"
              style={{ backgroundColor: `${currentQ.pillarColor}20`, border: `2px solid ${currentQ.pillarColor}40` }}
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <PIcon size={28} style={{ color: currentQ.pillarColor }} className="sm:hidden" />
              <PIcon size={36} style={{ color: currentQ.pillarColor }} className="hidden sm:block" />
            </motion.div>
            <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-2">
              Pillar {currentQ.pillarIndex + 1} of {PILLARS.length}
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white">{currentQ.pillarName}</h2>
            <p className="text-xs sm:text-sm text-white/40 mt-2">{currentQ.totalInPillar} areas to assess</p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ─── FINAL REVEAL ───
  if (phase === 'final') {
    const probValue = probability?.overall ?? 0;
    const probColor = probValue >= 70 ? '#2ECC71' : probValue >= 45 ? '#D4A843' : '#E74C3C';
    const bandColor = result.band === 'green' ? '#2ECC71' : result.band === 'yellow' ? '#D4A843' : '#E74C3C';

    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 overflow-y-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/40 hover:text-white z-50 h-8 w-8 p-0"
        >
          <X size={18} />
        </Button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center w-full max-w-md sm:max-w-lg py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.3 }}
            className="mb-6 sm:mb-8"
          >
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full mx-auto flex items-center justify-center relative"
              style={{ border: `4px solid ${bandColor}`, backgroundColor: `${bandColor}10` }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `4px solid ${bandColor}` }}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div>
                <motion.p
                  className="text-4xl sm:text-5xl font-bold font-mono"
                  style={{ color: bandColor }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {result.percentage.toFixed(0)}%
                </motion.p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 mt-0.5">SOS Score</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mb-6 sm:mb-8">
            <p className="text-xs sm:text-sm text-white/40 mb-1">Scaling Probability</p>
            <p className="text-3xl sm:text-4xl font-bold font-mono" style={{ color: probColor }}>
              {probValue.toFixed(0)}%
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/30 mb-1">Scored</p>
              <p className="text-lg sm:text-xl font-bold font-data text-white">{scoredCount}</p>
              <p className="text-[8px] sm:text-[9px] text-white/20">of {ALL_SUBCATEGORY_IDS.length}</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-red-400/50 mb-1">Alerts</p>
              <p className="text-lg sm:text-xl font-bold font-data text-red-400">{alertCount}</p>
              <p className="text-[8px] sm:text-[9px] text-white/20">critical</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-emerald-400/50 mb-1">Strong</p>
              <p className="text-lg sm:text-xl font-bold font-data text-emerald-400">
                {Object.values(inputs).filter(i => i.score >= 4).length}
              </p>
              <p className="text-[8px] sm:text-[9px] text-white/20">areas</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }} className="space-y-2 mb-6 sm:mb-8">
            {result.pillars.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 sm:gap-3">
                <span className="text-[10px] sm:text-sm text-white/50 w-16 sm:w-24 text-right truncate">{p.label}</span>
                <div className="flex-1 h-2 sm:h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: PILLAR_COLORS[i] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${p.percentage}%` }}
                    transition={{ duration: 1.5, delay: 1.8 + i * 0.2 }}
                  />
                </div>
                <span className="font-data text-xs sm:text-sm font-bold w-10 sm:w-12 text-right" style={{ color: PILLAR_COLORS[i] }}>
                  {p.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
            <Button
              onClick={onExit}
              className="bg-[#C8962E] text-black hover:bg-[#D4A843] h-11 sm:h-12 px-8 sm:px-10 text-sm sm:text-base font-bold w-full sm:w-auto"
            >
              View Full Report
              <ChevronRight size={18} className="ml-1" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ─── SCORING SCREEN ───
  if (!currentQ) return null;

  const PillarIcon = PILLAR_ICONS[currentQ.pillarIndex];
  const progress = ((questionIndex + 1) / questions.length) * 100;
  const currentScore = inputs[currentQ.subId]?.score || 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* HUD Bar */}
      <div className="shrink-0 border-b border-white/5 bg-black/80 backdrop-blur-sm">
        <div className="h-0.5 sm:h-1 bg-white/5 w-full">
          <motion.div className="h-full bg-[#C8962E]" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>

        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <PillarIcon size={14} style={{ color: currentQ.pillarColor }} />
              <span className="text-[10px] sm:text-xs font-bold text-white/60 hidden sm:inline">{currentQ.pillarName}</span>
            </div>
            <span className="font-data text-[10px] sm:text-xs text-white/30">
              {questionIndex + 1}/{questions.length}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {scoredCount > 0 && (
              <>
                <div className="text-center">
                  <p className="font-data text-sm sm:text-lg font-bold text-[#C8962E]">{result.percentage.toFixed(0)}%</p>
                  <p className="text-[7px] sm:text-[8px] uppercase tracking-wider text-white/20 hidden sm:block">Score</p>
                </div>
                {probability && (
                  <div className="text-center">
                    <p className="font-data text-sm sm:text-lg font-bold" style={{
                      color: probability.overall >= 70 ? '#2ECC71' : probability.overall >= 45 ? '#D4A843' : '#E74C3C'
                    }}>
                      {probability.overall.toFixed(0)}%
                    </p>
                    <p className="text-[7px] sm:text-[8px] uppercase tracking-wider text-white/20 hidden sm:block">Prob</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {alertCount > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle size={12} className="text-red-400" />
                <span className="font-data text-xs text-red-400">{alertCount}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={onExit} className="text-white/30 hover:text-white h-7 w-7 sm:h-8 sm:w-8 p-0">
              <X size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.subId}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            {/* Pillar badge */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${currentQ.pillarColor}15`, border: `1px solid ${currentQ.pillarColor}30` }}
              >
                <PillarIcon size={12} style={{ color: currentQ.pillarColor }} />
              </div>
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-white/30">
                {currentQ.pillarName} · {currentQ.subIndex + 1} of {currentQ.totalInPillar}
              </span>
            </div>

            {/* Question */}
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-5 sm:mb-8 leading-tight">
              {currentQ.subName}
            </h2>

            {/* Score Options — stack on mobile, 3-col on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {SCORE_OPTIONS.map((opt) => {
                const desc = getDescription(currentQ.subId, opt.score);
                const isSelected = currentScore === opt.score;
                const isAnimating = animatingScore && lastScoredValue === opt.score;

                return (
                  <motion.button
                    key={opt.score}
                    onClick={() => handleScore(opt.score)}
                    disabled={animatingScore}
                    className={`
                      relative rounded-xl border p-3 sm:p-4 text-left transition-all
                      ${isAnimating
                        ? 'scale-95 border-white/40'
                        : isSelected
                        ? `bg-gradient-to-br ${opt.bgClass}`
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98]'
                      }
                    `}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isAnimating && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: opt.color }}
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    )}

                    <div className="relative flex sm:flex-col items-start sm:items-start gap-3 sm:gap-0">
                      <div className="shrink-0">
                        <span className="text-lg sm:text-2xl">{opt.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:mt-2">
                          <p className="text-sm sm:text-base font-bold text-white">{opt.label}</p>
                          <span className="text-[9px] sm:text-[10px] font-data text-white/20 hidden sm:inline">[{opt.score}/5]</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-white/30 mt-0.5">{opt.sublabel}</p>
                        {desc && (
                          <p className="text-[10px] sm:text-xs text-white/20 mt-1.5 sm:mt-2 leading-relaxed line-clamp-2 sm:line-clamp-none">
                            {desc}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 sm:hidden">
                        <span className="font-data text-xs font-bold px-2 py-1 rounded-md" style={{ color: opt.color, backgroundColor: `${opt.color}15` }}>
                          {opt.score}/5
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4 sm:mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={questionIndex === 0}
                className="text-white/30 hover:text-white h-8 sm:h-9 text-xs sm:text-sm gap-1 disabled:opacity-20"
              >
                <ChevronLeft size={14} />
                Back
              </Button>

              <div className="hidden sm:flex items-center gap-3 text-[9px] text-white/15 font-mono">
                <span>1-5 to score</span>
                <span>←→ navigate</span>
                <span>ESC exit</span>
              </div>

              {currentScore > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isLastQuestion) {
                      setPhase('final');
                    } else {
                      setQuestionIndex(prev => prev + 1);
                    }
                  }}
                  className="text-[#C8962E]/60 hover:text-[#C8962E] h-8 sm:h-9 text-xs sm:text-sm gap-1"
                >
                  Skip
                  <ChevronRight size={14} />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
