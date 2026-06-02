/**
 * ConsultationView — 100% Sales-Oriented Discovery Flow
 *
 * Flow:
 * 1. INTAKE SCREEN — business name, current revenue, revenue goal
 * 2. QUESTION FLOW — one question at a time, full-screen
 * 3. FINAL REVEAL — total cost of inaction + CTA
 *
 * If revenue < $10k, Team pillar is auto-failed (can't afford a team).
 * Auto-advance is fast (1.5s) for quick sales calls.
 *
 * Brand: Scale Detailing — black bg, gold (#C8962E) accent, white text
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, X, AlertTriangle, TrendingDown,
  CheckCircle2, MinusCircle, Sparkles, DollarSign,
  Building2, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PILLARS, computeSOS, computeScalingProbability, ALL_SUBCATEGORY_IDS } from '@/lib/sos-engine';
import { getConsultationDesc } from '@/lib/consultation-descriptions';
import { computeCostOfNotChanging, formatCurrency } from '@/lib/cost-engine';
import type { SubcategoryInput, RevenueTier } from '@/lib/sos-engine';

// ─── Types ───

interface ConsultationViewProps {
  inputs: Record<string, SubcategoryInput>;
  onInputChange: (subId: string, score: number, note: string) => void;
  revenueTier: RevenueTier;
  customTarget?: number;
  onGenerateReport: () => void;
  onBack: () => void;
  onReset: () => void;
  meta: { shopName: string; assessorName: string };
  onMetaChange?: (meta: { shopName: string; assessorName: string; assessmentDate: string; notes: string; city: string; state: string }) => void;
  onRevenueChange?: (current: number | null, tier: RevenueTier, custom?: number) => void;
  currentRevenue?: number | null;
  goalRevenue?: number | null;
}

// ─── Constants ───

const GOLD = '#C8962E';
const GOLD_LIGHT = '#D4A94E';
const TEAM_REVENUE_THRESHOLD = 10000; // Under $10k = auto-fail team
const AUTO_ADVANCE_MS = 1500; // Fast for sales calls

// Team subcategory IDs
const TEAM_SUB_IDS = [
  'labor_efficiency', 'staffing_coverage', 'team_quality',
  'training_standardization', 'onboarding_process', 'hiring_process',
  'culture_morale', 'compensation_structure',
];

// Flatten all subcategories into a single ordered list
const ALL_QUESTIONS = PILLARS.flatMap(pillar =>
  pillar.subcategories.map(sub => ({
    subId: sub.id,
    pillarId: pillar.id,
    pillarLabel: pillar.label,
    label: sub.label,
    weight: sub.weight,
  }))
);

// Estimate monthly cost impact per weight point
function estimatePainCost(weight: number, score: number, goalRevenue: number): number {
  if (score >= 4) return 0;
  const totalWeightPoints = ALL_QUESTIONS.reduce((s, q) => s + q.weight, 0);
  const shareOfRevenue = weight / totalWeightPoints;
  const gapMultiplier = score <= 1 ? 0.8 : 0.4;
  return Math.round(goalRevenue * shareOfRevenue * gapMultiplier / 100) * 100;
}

// ─── Revenue Tier Options ───

const TIER_OPTIONS: { value: RevenueTier; label: string; range: string }[] = [
  { value: '20-30', label: '$20k–$30k', range: 'per month' },
  { value: '30-40', label: '$30k–$40k', range: 'per month' },
  { value: '40-50', label: '$40k–$50k', range: 'per month' },
  { value: 'custom', label: 'Custom', range: 'set your own' },
];

// ─── Intake Screen ───

function IntakeScreen({
  shopName,
  currentRevenue,
  revenueTier,
  customTarget,
  onStart,
  onShopNameChange,
  onRevenueChange,
  onTierChange,
  onCustomTargetChange,
  onBack,
}: {
  shopName: string;
  currentRevenue: number | null;
  revenueTier: RevenueTier;
  customTarget: number;
  onStart: () => void;
  onShopNameChange: (name: string) => void;
  onRevenueChange: (rev: number | null) => void;
  onTierChange: (tier: RevenueTier) => void;
  onCustomTargetChange: (target: number) => void;
  onBack: () => void;
}) {
  const canStart = shopName.trim().length > 0;
  const isUnder10k = currentRevenue !== null && currentRevenue < TEAM_REVENUE_THRESHOLD;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 relative">
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ background: `radial-gradient(ellipse at 50% 30%, ${GOLD} 0%, transparent 60%)` }}
      />

      {/* Back to Assessment button — top left */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Assessment Mode</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
            alt="Scale Detailing"
            className="h-8 w-auto"
          />
          <div className="h-5 w-px bg-white/10" />
          <span className="text-sm font-bold tracking-wider text-white">
            Growth <span className="font-normal text-xs" style={{ color: GOLD }}>Consultation</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
          Let's assess your business
        </h1>
        <p className="text-muted-foreground text-sm text-center mb-8">
          Quick setup before we dive into the discovery
        </p>

        {/* Form */}
        <div className="space-y-5">
          {/* Business Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <Building2 size={13} />
              Business Name
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => onShopNameChange(e.target.value)}
              placeholder="e.g. Elite Auto Spa"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-base"
              autoFocus
            />
          </div>

          {/* Current Revenue */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <DollarSign size={13} />
              Current Monthly Revenue
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base">$</span>
              <input
                type="number"
                value={currentRevenue ?? ''}
                onChange={(e) => onRevenueChange(e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g. 18000"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-8 pr-4 py-3.5 text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-base font-mono"
              />
            </div>
            {isUnder10k && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs mt-2 flex items-center gap-1.5"
                style={{ color: '#F59E0B' }}
              >
                <AlertTriangle size={12} />
                Under $10k/mo — team-building questions will be auto-assessed
              </motion.p>
            )}
          </div>

          {/* Revenue Goal */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <TrendingDown size={13} className="rotate-180" />
              Revenue Goal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIER_OPTIONS.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => onTierChange(tier.value)}
                  className="rounded-xl border px-3 py-3 text-center transition-all"
                  style={{
                    borderColor: revenueTier === tier.value ? `${GOLD}80` : 'rgba(255,255,255,0.08)',
                    background: revenueTier === tier.value ? `${GOLD}10` : 'rgba(255,255,255,0.02)',
                    color: revenueTier === tier.value ? GOLD : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <span className="text-sm font-semibold block">{tier.label}</span>
                  <span className="text-[10px] opacity-60">{tier.range}</span>
                </button>
              ))}
            </div>
            {revenueTier === 'custom' && (
              <div className="mt-2 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base">$</span>
                <input
                  type="number"
                  value={customTarget}
                  onChange={(e) => onCustomTargetChange(Math.max(10000, Number(e.target.value)))}
                  step={5000}
                  min={10000}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-8 pr-4 py-3 text-white font-mono focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                />
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Button
            onClick={onStart}
            disabled={!canStart}
            className="w-full h-14 text-base gap-3 rounded-xl shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canStart ? GOLD : `${GOLD}40`,
              color: '#000',
              boxShadow: canStart ? `0 8px 30px ${GOLD}30` : 'none',
            }}
          >
            Start Discovery
            <ChevronRight size={20} />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Pain Reveal Component ───

function PainReveal({ cost, score }: { cost: number; score: number }) {
  if (score >= 4) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-5 sm:mt-6 flex items-center gap-3 justify-center"
      >
        <CheckCircle2 size={18} className="text-emerald-400" />
        <span className="text-emerald-400 text-sm font-medium">
          This area is solid. Nice work.
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2, type: 'spring', stiffness: 150 }}
      className="mt-5 sm:mt-6"
    >
      <div className="relative mx-auto max-w-md">
        <div
          className="absolute inset-0 rounded-xl blur-xl opacity-15"
          style={{ backgroundColor: score <= 1 ? '#EF4444' : '#F59E0B' }}
        />
        <div
          className="relative rounded-xl border px-5 py-3.5 text-center"
          style={{
            borderColor: score <= 1 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)',
            background: score <= 1
              ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))'
              : 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <TrendingDown size={14} style={{ color: score <= 1 ? '#EF4444' : '#F59E0B' }} />
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: score <= 1 ? '#EF4444' : '#F59E0B' }}>
              {score <= 1 ? 'Revenue Leak' : 'Opportunity Gap'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            ~{formatCurrency(cost)}<span className="text-sm text-muted-foreground font-normal">/mo</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Issues Counter ───

function IssuesCounter({ issues, total }: { issues: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {issues > 0 && (
        <motion.div
          key={issues}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <AlertTriangle size={12} className="text-red-400" />
          <span className="text-red-400 font-bold text-xs font-mono">{issues}</span>
        </motion.div>
      )}
      <div className="text-xs text-muted-foreground">
        {total}/{ALL_QUESTIONS.length}
      </div>
    </div>
  );
}

// ─── Situation Card ───

function SituationCard({ label, description, isSelected, onClick, variant }: {
  score: number;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  variant: 'bad' | 'mid' | 'good';
}) {
  const configs = {
    bad: {
      Icon: AlertTriangle,
      color: '#EF4444',
      borderDefault: 'rgba(239,68,68,0.12)',
      borderActive: 'rgba(239,68,68,0.5)',
      bgDefault: 'rgba(239,68,68,0.02)',
      bgActive: 'rgba(239,68,68,0.06)',
      tagBg: 'rgba(239,68,68,0.1)',
    },
    mid: {
      Icon: MinusCircle,
      color: '#F59E0B',
      borderDefault: 'rgba(245,158,11,0.12)',
      borderActive: 'rgba(245,158,11,0.5)',
      bgDefault: 'rgba(245,158,11,0.02)',
      bgActive: 'rgba(245,158,11,0.06)',
      tagBg: 'rgba(245,158,11,0.1)',
    },
    good: {
      Icon: CheckCircle2,
      color: '#10B981',
      borderDefault: 'rgba(16,185,129,0.12)',
      borderActive: 'rgba(16,185,129,0.5)',
      bgDefault: 'rgba(16,185,129,0.02)',
      bgActive: 'rgba(16,185,129,0.06)',
      tagBg: 'rgba(16,185,129,0.1)',
    },
  };

  const c = configs[variant];
  const Icon = c.Icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-xl border-2 p-4 sm:p-5 transition-all duration-200 relative overflow-hidden"
      style={{
        borderColor: isSelected ? c.borderActive : c.borderDefault,
        background: isSelected ? c.bgActive : c.bgDefault,
      }}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: c.color }}
        >
          <CheckCircle2 size={12} className="text-black" />
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: c.tagBg }}
        >
          <Icon size={16} style={{ color: c.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5"
            style={{ backgroundColor: c.tagBg, color: c.color }}
          >
            {label}
          </div>
          <p className="text-sm text-white/85 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Final Reveal Screen ───

function FinalReveal({
  issueCount,
  totalAnswered,
  monthlyCost,
  annualCost,
  shopName,
  probability,
  onGenerateReport,
}: {
  issueCount: number;
  totalAnswered: number;
  monthlyCost: number;
  annualCost: number;
  shopName: string;
  probability: number | null;
  onGenerateReport: () => void;
}) {
  const [showCosts, setShowCosts] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCosts(true), 600);
    const t2 = setTimeout(() => setShowCTA(true), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(ellipse at center, ${GOLD} 0%, transparent 70%)` }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center max-w-lg w-full"
      >
        {/* Issue count badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
          style={{
            background: issueCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            border: `1px solid ${issueCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          }}
        >
          <AlertTriangle size={14} className={issueCount > 0 ? 'text-red-400' : 'text-emerald-400'} />
          <span className={`font-bold text-sm ${issueCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {issueCount} issue{issueCount !== 1 ? 's' : ''} found
          </span>
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {shopName ? `${shopName}, here's` : "Here's"} what we found
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Based on our conversation, these gaps are impacting your bottom line
        </p>

        {/* Cost reveal */}
        <AnimatePresence>
          {showCosts && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
              className="space-y-4"
            >
              {/* Monthly cost */}
              <div className="relative mx-auto max-w-md">
                <div
                  className="absolute inset-0 rounded-2xl blur-2xl opacity-15"
                  style={{ backgroundColor: '#EF4444' }}
                />
                <div
                  className="relative rounded-2xl border-2 px-6 py-6"
                  style={{
                    borderColor: 'rgba(239,68,68,0.3)',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(0,0,0,0.4))',
                  }}
                >
                  <div className="text-xs uppercase tracking-widest text-red-400/70 font-semibold mb-1">
                    Estimated Revenue Left on the Table
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl sm:text-5xl font-bold text-white font-mono">
                      {formatCurrency(monthlyCost)}
                    </span>
                    <span className="text-base text-muted-foreground">/mo</span>
                  </div>
                </div>
              </div>

              {/* Annual projection */}
              <div className="text-center">
                <span className="text-muted-foreground text-sm">That's </span>
                <span className="text-xl sm:text-2xl font-bold font-mono" style={{ color: GOLD }}>
                  {formatCurrency(annualCost)}
                </span>
                <span className="text-muted-foreground text-sm"> over 12 months</span>
              </div>

              {/* Probability teaser */}
              {probability !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl border px-5 py-4 mx-auto max-w-sm"
                  style={{
                    borderColor: probability < 40 ? 'rgba(239,68,68,0.2)' : probability < 70 ? `${GOLD}25` : 'rgba(16,185,129,0.2)',
                    background: probability < 40 ? 'rgba(239,68,68,0.03)' : probability < 70 ? `${GOLD}05` : 'rgba(16,185,129,0.03)',
                  }}
                >
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Current Probability of Reaching Your Goal
                  </div>
                  <div
                    className="text-3xl font-bold font-mono"
                    style={{
                      color: probability < 40 ? '#EF4444' : probability < 70 ? GOLD : '#10B981',
                    }}
                  >
                    {Math.round(probability)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {probability < 40
                      ? 'Without changes, scaling will be very difficult'
                      : probability < 70
                        ? 'You have a foundation, but gaps are holding you back'
                        : 'You\'re in a strong position to scale'}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-10 space-y-3"
            >
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Let me show you the full picture — where the gaps are and what your growth trajectory looks like
              </p>
              <Button
                onClick={onGenerateReport}
                className="h-13 px-8 text-base gap-2.5 rounded-xl shadow-lg"
                style={{
                  backgroundColor: GOLD,
                  color: '#000',
                  boxShadow: `0 8px 30px ${GOLD}40`,
                }}
              >
                <Sparkles size={18} />
                See Your Full Report
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───

export default function ConsultationView({
  inputs, onInputChange, revenueTier, customTarget,
  onGenerateReport, onBack, onReset, meta,
  onMetaChange, onRevenueChange,
  currentRevenue, goalRevenue,
}: ConsultationViewProps) {
  // Phases: 'intake' | 'questions' | 'reveal'
  const [phase, setPhase] = useState<'intake' | 'questions' | 'reveal'>('intake');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showPainReveal, setShowPainReveal] = useState(false);
  const [direction, setDirection] = useState(1);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local intake state (synced to parent on start)
  const [localShopName, setLocalShopName] = useState(meta.shopName || '');
  const [localRevenue, setLocalRevenue] = useState<number | null>(currentRevenue ?? null);
  const [localTier, setLocalTier] = useState<RevenueTier>(revenueTier);
  const [localCustomTarget, setLocalCustomTarget] = useState(customTarget || 60000);

  // Filter out team questions if revenue < $10k
  const isUnder10k = localRevenue !== null && localRevenue < TEAM_REVENUE_THRESHOLD;
  const activeQuestions = useMemo(() => {
    if (isUnder10k) {
      return ALL_QUESTIONS.filter(q => !TEAM_SUB_IDS.includes(q.subId));
    }
    return ALL_QUESTIONS;
  }, [isUnder10k]);

  // Compute results
  const result = useMemo(() => computeSOS(inputs), [inputs]);
  const probability = useMemo(() => {
    const scored = Object.values(inputs).filter(i => i.score > 0).length;
    if (scored === 0) return null;
    return computeScalingProbability(result, localTier, localTier === 'custom' ? localCustomTarget : undefined, undefined, inputs);
  }, [result, localTier, localCustomTarget, inputs]);

  // Goal revenue
  const effectiveGoal = useMemo(() => {
    if (goalRevenue) return goalRevenue;
    switch (localTier) {
      case '20-30': return 30000;
      case '30-40': return 40000;
      case '40-50': return 50000;
      case 'custom': return localCustomTarget || 60000;
    }
  }, [goalRevenue, localTier, localCustomTarget]);

  // Current question
  const currentQ = activeQuestions[currentIdx];
  const desc = currentQ ? getConsultationDesc(currentQ.subId) : null;
  const currentInput = currentQ ? inputs[currentQ.subId] : null;
  const currentScore = currentInput?.score || 0;

  // Stats
  const answeredCount = useMemo(
    () => Object.values(inputs).filter(i => i.score > 0).length,
    [inputs]
  );
  const issueCount = useMemo(
    () => Object.entries(inputs).filter(([_, i]) => i.score > 0 && i.score <= 3).length,
    [inputs]
  );

  // Total estimated monthly cost
  const totalMonthlyCost = useMemo(() => {
    let total = 0;
    for (const q of ALL_QUESTIONS) {
      const inp = inputs[q.subId];
      if (inp && inp.score > 0 && inp.score < 5) {
        total += estimatePainCost(q.weight, inp.score, effectiveGoal);
      }
    }
    return total;
  }, [inputs, effectiveGoal]);

  // ─── Intake → Start ───
  const handleStart = useCallback(() => {
    // Sync intake data to parent
    if (onMetaChange) {
      onMetaChange({
        shopName: localShopName,
        assessorName: meta.assessorName,
        assessmentDate: new Date().toISOString().slice(0, 10),
        notes: '',
        city: '',
        state: '',
      });
    }
    if (onRevenueChange) {
      onRevenueChange(localRevenue, localTier, localTier === 'custom' ? localCustomTarget : undefined);
    }

    // Auto-fail team if under $10k
    if (localRevenue !== null && localRevenue < TEAM_REVENUE_THRESHOLD) {
      for (const subId of TEAM_SUB_IDS) {
        onInputChange(subId, 1, 'Auto-assessed: Revenue under $10k — team building not yet viable');
      }
    }

    setPhase('questions');
  }, [localShopName, localRevenue, localTier, localCustomTarget, meta.assessorName, onMetaChange, onRevenueChange, onInputChange]);

  // ─── Score a question ───
  const handleScore = useCallback((score: number) => {
    if (!currentQ) return;
    onInputChange(currentQ.subId, score, '');
    setShowPainReveal(true);

    // Fast auto-advance
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      setShowPainReveal(false);
      if (currentIdx < activeQuestions.length - 1) {
        setDirection(1);
        setCurrentIdx(prev => prev + 1);
      } else {
        setPhase('reveal');
      }
    }, AUTO_ADVANCE_MS);
  }, [currentQ, currentIdx, activeQuestions.length, onInputChange]);

  // Skip / go back
  const goNext = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setShowPainReveal(false);
    if (currentIdx < activeQuestions.length - 1) {
      setDirection(1);
      setCurrentIdx(prev => prev + 1);
    } else {
      setPhase('reveal');
    }
  }, [currentIdx, activeQuestions.length]);

  const goBack = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setShowPainReveal(false);
    if (currentIdx > 0) {
      setDirection(-1);
      setCurrentIdx(prev => prev - 1);
    }
  }, [currentIdx]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  // ─── INTAKE PHASE ───
  if (phase === 'intake') {
    return (
      <IntakeScreen
        shopName={localShopName}
        currentRevenue={localRevenue}
        revenueTier={localTier}
        customTarget={localCustomTarget}
        onStart={handleStart}
        onShopNameChange={setLocalShopName}
        onRevenueChange={setLocalRevenue}
        onTierChange={setLocalTier}
        onCustomTargetChange={setLocalCustomTarget}
        onBack={onBack}
      />
    );
  }

  // ─── REVEAL PHASE ───
  if (phase === 'reveal') {
    return (
      <div className="min-h-screen bg-black">
        <FinalReveal
          issueCount={issueCount}
          totalAnswered={answeredCount}
          monthlyCost={totalMonthlyCost}
          annualCost={totalMonthlyCost * 12}
          shopName={localShopName || meta.shopName}
          probability={probability?.overall ?? null}
          onGenerateReport={onGenerateReport}
        />
      </div>
    );
  }

  // ─── QUESTIONS PHASE ───
  if (!currentQ || !desc) return null;

  const progressPct = ((currentIdx + (currentScore > 0 ? 1 : 0)) / activeQuestions.length) * 100;
  const painCost = currentScore > 0 ? estimatePainCost(currentQ.weight, currentScore, effectiveGoal) : 0;

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(${GOLD} 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Top Bar */}
      <header className="relative z-20 border-b border-white/5">
        <div className="px-4 sm:px-8 flex items-center justify-between h-12">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <X size={14} />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <div className="flex items-center gap-3">
            <IssuesCounter issues={issueCount} total={answeredCount} />
          </div>

          <button
            onClick={goNext}
            className="text-xs text-muted-foreground hover:text-white transition-colors"
          >
            Skip →
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <motion.div
            className="h-full"
            style={{ backgroundColor: GOLD }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIdx}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full max-w-xl mx-auto"
          >
            {/* Category tag */}
            <div className="text-center mb-5 sm:mb-6">
              <span
                className="inline-block text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  color: `${GOLD}90`,
                  backgroundColor: `${GOLD}08`,
                  border: `1px solid ${GOLD}12`,
                }}
              >
                {currentQ.pillarLabel} · {currentIdx + 1} of {activeQuestions.length}
              </span>
            </div>

            {/* Question */}
            <h2 className="text-lg sm:text-2xl font-bold text-white text-center mb-6 sm:mb-8 leading-tight px-2">
              {desc.question}
            </h2>

            {/* Situation Cards */}
            <div className="space-y-2.5 sm:space-y-3">
              <SituationCard
                score={1}
                label="That's us"
                description={desc.needsWork}
                isSelected={currentScore === 1}
                onClick={() => handleScore(1)}
                variant="bad"
              />
              <SituationCard
                score={3}
                label="We're getting there"
                description={desc.okay}
                isSelected={currentScore === 3}
                onClick={() => handleScore(3)}
                variant="mid"
              />
              <SituationCard
                score={5}
                label="We've got this handled"
                description={desc.strong}
                isSelected={currentScore === 5}
                onClick={() => handleScore(5)}
                variant="good"
              />
            </div>

            {/* Pain Reveal */}
            <AnimatePresence>
              {showPainReveal && currentScore > 0 && (
                <PainReveal cost={painCost} score={currentScore} />
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <footer className="relative z-20 border-t border-white/5 px-4 sm:px-8">
        <div className="flex items-center justify-between h-12 max-w-xl mx-auto">
          <button
            onClick={goBack}
            disabled={currentIdx === 0}
            className="text-xs text-muted-foreground hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {totalMonthlyCost > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingDown size={12} className="text-red-400/60" />
              <span className="text-[10px] text-muted-foreground">Gaps:</span>
              <motion.span
                key={totalMonthlyCost}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-xs font-bold font-data text-red-400"
              >
                ~{formatCurrency(totalMonthlyCost)}/mo
              </motion.span>
            </div>
          )}

          <button
            onClick={goNext}
            className="text-xs flex items-center gap-1 transition-colors hover:text-white"
            style={{ color: GOLD }}
          >
            {currentIdx === activeQuestions.length - 1 ? 'Finish' : 'Next'}
            <ArrowRight size={13} />
          </button>
        </div>
      </footer>
    </div>
  );
}
