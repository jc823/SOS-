/**
 * ConsultationReport — Sales Closing Document
 *
 * This is NOT a technical report. This is a sales presentation designed to:
 * 1. Show the customer their probability of reaching their goal
 * 2. Highlight the cost of doing nothing (financial pain)
 * 3. Show where the gaps are (vague — don't give away the playbook)
 * 4. Show "With Scale" — projected 70-80% probability, presented as growth %
 * 5. Close with a strong CTA to join the program
 *
 * NO action plan shown. NO locked teasers. Just sell.
 *
 * Brand: Scale Detailing — black bg, gold (#C8962E) accent, white text
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingDown, TrendingUp, AlertTriangle,
  DollarSign, Zap, Target, Rocket, CheckCircle2,
  ChevronDown, Printer, Shield, ArrowUpRight, ArrowRight,
  Sparkles, Star, BarChart3, Megaphone, ExternalLink, Copy, Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PILLARS, getProbabilityColor, getProbabilityLabel,
  type RevenueTier, type SOSResult, type SubcategoryInput, type ScalingProbability,
} from '@/lib/sos-engine';
import { computeCostOfNotChanging, computeTrajectoryData, formatCurrency } from '@/lib/cost-engine';
import { computeAdSpendROI } from '@/lib/ad-spend-engine';
// GrowthTrajectoryChart shelved
import type { BusinessProfile } from '@shared/business-profile';

// ─── Props ───

interface ConsultationReportProps {
  result: SOSResult;
  inputs: Record<string, SubcategoryInput>;
  meta: {
    shopName: string;
    assessorName: string;
    assessmentDate: string;
    notes: string;
  };
  probability: ScalingProbability;
  onBack?: () => void;
  onShareLink?: () => void;
  onCopyLink?: () => void;
  onTierChange?: (tier: RevenueTier, customTarget?: number) => void;
  onGoalRevenueChange?: (goalRevenue: number) => void;
  customerLogoUrl?: string | null;
  revenueTier?: RevenueTier;
  customTarget?: number;
  currentRevenue?: number;
  goalRevenue?: number;
  businessProfile?: BusinessProfile | null;
}

// ─── Constants ───

const GOLD = '#C8962E';
const GOLD_LIGHT = '#D4A94E';
const SCALE_LOGO = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png';

// ─── Loading Animation ───

function ReportLoadingAnimation({ shopName, onComplete }: { shopName: string; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Analyzing your business data', icon: <BarChart3 size={20} /> },
    { label: 'Calculating growth potential', icon: <TrendingUp size={20} /> },
    { label: 'Identifying revenue opportunities', icon: <DollarSign size={20} /> },
    { label: 'Building your growth roadmap', icon: <Rocket size={20} /> },
  ];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i), i * 900));
    });
    timers.push(setTimeout(onComplete, steps.length * 900 + 600));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        {/* Logo */}
        <motion.img
          src={SCALE_LOGO}
          alt="Scale Detailing"
          className="h-10 w-auto mx-auto mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        />

        {/* Shop name */}
        <motion.h2
          className="text-xl sm:text-2xl font-bold text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {shopName ? (
            <>Preparing report for <span style={{ color: GOLD }}>{shopName}</span></>
          ) : (
            'Preparing your report'
          )}
        </motion.h2>

        <motion.p
          className="text-sm text-muted-foreground mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Crunching the numbers...
        </motion.p>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: step >= i ? 1 : 0.2,
                x: step >= i ? 0 : -20,
              }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500"
                style={{
                  backgroundColor: step >= i ? `${GOLD}20` : 'rgba(255,255,255,0.03)',
                  color: step >= i ? GOLD : 'rgba(255,255,255,0.15)',
                }}
              >
                {step > i ? <CheckCircle2 size={18} /> : s.icon}
              </div>
              <span
                className="text-sm font-medium transition-colors duration-500"
                style={{ color: step >= i ? 'white' : 'rgba(255,255,255,0.2)' }}
              >
                {s.label}
              </span>
              {step === i && (
                <motion.div
                  className="ml-auto"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <div
                    className="w-4 h-4 border-2 rounded-full"
                    style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
                  />
                </motion.div>
              )}
              {step > i && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-auto text-xs font-semibold"
                  style={{ color: GOLD }}
                >
                  Done
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-8 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: GOLD }}
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(100, ((step + 1) / steps.length) * 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Animated Counter ───

function AnimatedNumber({ value, duration = 1.8, suffix = '', prefix = '' }: {
  value: number; duration?: number; suffix?: string; prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  useState(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  });
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

// ─── Section Wrapper ───

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className={`py-12 sm:py-16 ${className}`}
    >
      {children}
    </motion.section>
  );
}

// ─── Vague pillar descriptions for sales (don't give away the playbook) ───

const PILLAR_VAGUE_FIXES: Record<string, {
  problem: string;
  solution: string;
  howWeHelp: string[];
  icon: React.ReactNode;
}> = {
  services: {
    problem: 'Inconsistent service delivery is costing you repeat customers and referrals',
    solution: 'We build standardized systems so every car leaves perfect — every time',
    howWeHelp: [
      'Build a tiered service menu with clear pricing that maximizes ticket value',
      'Create SOPs and quality checklists so every job meets the same standard',
      'Set up customer follow-up systems that drive repeat bookings and referrals',
      'Implement upsell workflows so your team captures more revenue per visit',
    ],
    icon: <Shield size={18} />,
  },
  sales: {
    problem: 'Leads are falling through the cracks and revenue opportunities are being missed',
    solution: 'We install proven sales systems that convert more leads into paying customers',
    howWeHelp: [
      'Build a lead follow-up system so no inquiry goes unanswered',
      'Create scripts and objection-handling frameworks for your team',
      'Set up a CRM pipeline so you always know where every lead stands',
      'Install booking and scheduling systems that reduce friction and no-shows',
    ],
    icon: <DollarSign size={18} />,
  },
  ads: {
    problem: 'Your marketing spend isn\'t generating the return it should',
    solution: 'We optimize your marketing engine to lower costs and increase quality leads',
    howWeHelp: [
      'Audit and restructure your ad campaigns for better cost-per-lead',
      'Build high-converting landing pages tailored to your services',
      'Set up tracking and attribution so you know exactly what\'s working',
      'Develop a content and review strategy that builds trust before the first call',
    ],
    icon: <Target size={18} />,
  },
  team: {
    problem: 'Team issues are limiting your capacity to grow and scale',
    solution: 'We help you build a team that runs without you being there every day',
    howWeHelp: [
      'Create hiring systems and job descriptions that attract the right people',
      'Build training programs so new hires get productive fast',
      'Set up performance tracking and accountability frameworks',
      'Design an org structure and pay plans that scale with your revenue',
    ],
    icon: <Star size={18} />,
  },
};

// ─── Main Component ───

export default function ConsultationReport({
  result, inputs, meta, probability, onBack,
  onShareLink, onCopyLink, onTierChange, onGoalRevenueChange,
  customerLogoUrl, revenueTier, customTarget,
  currentRevenue, goalRevenue, businessProfile,
}: ConsultationReportProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [showLoading, setShowLoading] = useState(true);

  // Compute financial data
  const cost = useMemo(
    () => computeCostOfNotChanging(result, probability, revenueTier || '20-30', customTarget, currentRevenue, goalRevenue),
    [result, probability, revenueTier, customTarget, currentRevenue, goalRevenue]
  );

  const trajectory = useMemo(
    () => computeTrajectoryData(cost, result.percentage),
    [cost, result.percentage]
  );

  // Issues found
  const issues = useMemo(() => {
    const list: { label: string; pillar: string; cost: number }[] = [];
    for (const pillar of PILLARS) {
      for (const sub of pillar.subcategories) {
        const inp = inputs[sub.id];
        if (inp && inp.score > 0 && inp.score <= 3) {
          const totalWeight = PILLARS.flatMap(p => p.subcategories).reduce((s, sc) => s + sc.weight, 0);
          const share = sub.weight / totalWeight;
          const gapMult = inp.score <= 1 ? 0.8 : 0.4;
          const estCost = Math.round(cost.goalRevenue * share * gapMult / 100) * 100;
          list.push({ label: sub.label, pillar: pillar.label, cost: estCost });
        }
      }
    }
    return list.sort((a, b) => b.cost - a.cost);
  }, [inputs, cost.goalRevenue]);

  const totalMonthlyCost = issues.reduce((s, i) => s + i.cost, 0);
  const probColor = getProbabilityColor(probability.overall);
  const probLabel = getProbabilityLabel(probability.overall);

  // Pillar summaries
  const pillarSummaries = useMemo(() => {
    return result.pillars.map(p => {
      const issuesInPillar = issues.filter(i => i.pillar === p.label);
      const pillarCost = issuesInPillar.reduce((s, i) => s + i.cost, 0);
      return {
        id: p.id,
        label: p.label,
        percentage: p.percentage,
        issueCount: issuesInPillar.length,
        totalCost: pillarCost,
      };
    });
  }, [result.pillars, issues]);

  // "With Scale" projected probability — always 70-80%
  const projectedProbability = useMemo(() => {
    // Always land between 70-80% regardless of current score
    const current = probability.overall;
    // Scale within 70-80 range: worse current = closer to 80, better current = closer to 70
    const projected = current < 20 ? 78 : current < 35 ? 76 : current < 50 ? 74 : current < 65 ? 72 : 70;
    return projected;
  }, [probability.overall]);

  // Growth percentage — how much we'll grow their revenue
  const growthPercentage = useMemo(() => {
    const current = currentRevenue || cost.currentRevenue;
    const goal = goalRevenue || cost.goalRevenue;
    if (current <= 0) return 60;
    const growth = Math.round(((goal - current) / current) * 100);
    // Cap between 40-80% for believability
    return Math.max(40, Math.min(80, growth));
  }, [currentRevenue, goalRevenue, cost.currentRevenue, cost.goalRevenue]);

  // ─── Ad Spend Slider State ───
  const [adSpendLevel, setAdSpendLevel] = useState<number>(
    businessProfile
      ? Math.round(
          (businessProfile.adSpend.googleAds || 0) +
          (businessProfile.adSpend.facebookMeta || 0)
        )
      : 1000
  );

  const adSpendProjection = useMemo(() => {
    const adsPillar = result.pillars.find(p => p.id === 'ads');
    const salesPillar = result.pillars.find(p => p.id === 'sales');
    // Use "With Scale" optimized scores for the consultation view
    const adsScore = Math.max(adsPillar?.percentage || 50, 75);
    const salesScore = Math.max(salesPillar?.percentage || 50, 70);
    const avgTicket = businessProfile?.averageTicketSize || 250;

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
        onlinePresence: { googleBusinessProfile: false, googleRating: null, website: true, activeSocialMedia: true, onlineBooking: true },
      }),
      adSpend: {
        googleAds: Math.round(adSpendLevel * 0.5) || null,
        facebookMeta: Math.round(adSpendLevel * 0.5) || null,
      },
      // Ensure online presence is optimized for "With Scale" scenario
      onlinePresence: {
        ...(businessProfile?.onlinePresence || { googleBusinessProfile: false, googleRating: null, website: false, activeSocialMedia: false, onlineBooking: false }),
        website: true,
        onlineBooking: true,
      },
    };

    return computeAdSpendROI(syntheticProfile, adsScore, salesScore, avgTicket);
  }, [adSpendLevel, result, businessProfile]);

  const AD_SPEND_PRESETS = [500, 1000, 2000, 3000, 5000];
  const fmtSpend = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${n}`;

  const handlePrint = () => {
    window.print();
  };

  // ─── Loading Animation ───
  if (showLoading) {
    return (
      <ReportLoadingAnimation
        shopName={meta.shopName}
        onComplete={() => setShowLoading(false)}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={printRef}
        className="min-h-screen bg-black text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* ─── Sticky Header ─── */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-black/90 backdrop-blur-xl print:hidden">
          <div className="container flex items-center justify-between h-14">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="flex items-center gap-2">
              {onCopyLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCopyLink}
                  className="h-8 text-xs gap-1.5 border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/40"
                >
                  <Copy size={13} />
                  <span className="hidden sm:inline">Copy Link</span>
                </Button>
              )}
              {onShareLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShareLink}
                  className="h-8 text-xs gap-1.5 border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/40"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs gap-1.5 border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
              >
                <Printer size={13} />
                Print
              </Button>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 1: Hero — Your Chances */}
        {/* ═══════════════════════════════════════════ */}
        <Section className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{ background: `radial-gradient(ellipse at 50% 30%, ${GOLD} 0%, transparent 60%)` }}
          />

          <div className="container relative text-center max-w-3xl mx-auto">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {customerLogoUrl ? (
                <img src={customerLogoUrl} alt="" className="h-10 w-auto rounded-lg" />
              ) : (
                <img src={SCALE_LOGO} alt="Scale Detailing" className="h-8 w-auto" />
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold mb-3 leading-tight">
              {meta.shopName ? (
                <><span style={{ color: GOLD }}>{meta.shopName}</span><br />Growth Assessment</>
              ) : (
                'Your Growth Assessment'
              )}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-10">
              Prepared by {meta.assessorName || 'Scale Detailing'} · {meta.assessmentDate}
            </p>

            {/* Probability headline */}
            <div className="relative mx-auto max-w-md mb-6">
              <div
                className="relative rounded-2xl border-2 px-8 py-8"
                style={{
                  borderColor: `${GOLD}30`,
                  background: `linear-gradient(135deg, ${GOLD}08, rgba(0,0,0,0.3))`,
                }}
              >
                <div className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: `${probColor}90` }}>
                  Your Current Chances of Hitting Your Revenue Goal
                </div>
                <div className="text-6xl sm:text-7xl font-bold font-mono" style={{ color: probColor }}>
                  <AnimatedNumber value={Math.round(probability.overall)} suffix="%" />
                </div>
                <div className="text-sm font-semibold mt-2" style={{ color: probColor }}>
                  {probLabel}
                </div>
                {probability.overall < 70 && (
                  <div className="text-xs text-muted-foreground mt-3">
                    Without changes, reaching your goal will be an uphill battle
                  </div>
                )}
              </div>
            </div>

            {/* Revenue context */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 text-center">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Where You Are</div>
                <div className="text-xl sm:text-2xl font-bold font-data text-white">
                  {formatCurrency(cost.currentRevenue)}<span className="text-sm text-muted-foreground font-normal">/mo</span>
                </div>
              </div>
              <div className="text-2xl text-muted-foreground">→</div>
              <div>
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: GOLD }}>Where You Want to Be</div>
                <div className="text-xl sm:text-2xl font-bold font-mono" style={{ color: GOLD }}>
                  {formatCurrency(cost.goalRevenue)}<span className="text-sm font-normal" style={{ color: `${GOLD}80` }}>/mo</span>
                </div>
              </div>
            </div>

            {/* Interactive Goal Revenue Input */}
            {onGoalRevenueChange && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mt-6"
              >
                <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-3 text-center">
                  How Much Do You Want to Grow To?
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm font-mono" style={{ color: `${GOLD}80` }}>$</span>
                  <input
                    type="number"
                    value={goalRevenue || cost.goalRevenue}
                    onChange={(e) => {
                      const val = Math.max(1000, Number(e.target.value));
                      onGoalRevenueChange(val);
                    }}
                    step={5000}
                    min={1000}
                    className="w-44 rounded-lg border px-4 py-2.5 text-lg font-data text-center font-bold focus:outline-none"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderColor: `${GOLD}30`,
                      color: GOLD,
                    }}
                  />
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {[20000, 30000, 40000, 50000, 75000, 100000].map(preset => (
                    <button
                      key={preset}
                      onClick={() => onGoalRevenueChange(preset)}
                      className="px-2.5 py-1 rounded text-[10px] font-semibold transition-all"
                      style={{
                        backgroundColor: (goalRevenue || cost.goalRevenue) === preset ? `${GOLD}20` : 'rgba(255,255,255,0.03)',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: (goalRevenue || cost.goalRevenue) === preset ? `${GOLD}40` : 'rgba(255,255,255,0.06)',
                        color: (goalRevenue || cost.goalRevenue) === preset ? GOLD : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {formatCurrency(preset)}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}


            {/* Scroll indicator */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-12 flex flex-col items-center text-muted-foreground/40"
            >
              <span className="text-[10px] uppercase tracking-widest mb-1">Scroll to see the full picture</span>
              <ChevronDown size={18} />
            </motion.div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION: With Scale — The Growth Promise */}
        {/* ═══════════════════════════════════════════ */}
        <Section className="relative overflow-hidden">
          {/* Bold gold gradient background */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, ${GOLD}08 0%, transparent 30%, transparent 70%, ${GOLD}05 100%)` }}
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ background: `radial-gradient(ellipse at 50% 30%, ${GOLD} 0%, transparent 50%)` }}
          />

          <div className="container relative max-w-4xl mx-auto">
            {/* Section hero — full-width banner */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-12"
            >
              <div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
                style={{ backgroundColor: `${GOLD}15`, border: `2px solid ${GOLD}30` }}
              >
                <img src={SCALE_LOGO} alt="Scale" className="h-5 w-auto" />
                <span className="text-sm font-bold tracking-wide" style={{ color: GOLD }}>Working with Scale</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-bold mb-4">
                Here's What Changes{' '}
                <span style={{ color: GOLD }}>When We Work Together</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                We've helped dozens of detailing businesses close these exact gaps and hit their revenue goals. Here's what that looks like for <span className="text-white font-semibold">{meta.shopName || 'your business'}</span>.
              </p>
            </motion.div>

            {/* ── Giant Growth Hero Card ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="rounded-3xl border-2 px-8 sm:px-12 py-12 sm:py-16 text-center mb-10 relative overflow-hidden"
              style={{
                borderColor: `${GOLD}40`,
                background: `linear-gradient(135deg, ${GOLD}10, rgba(0,0,0,0.4), ${GOLD}05)`,
                boxShadow: `0 0 80px ${GOLD}10, 0 0 160px ${GOLD}05`,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 py-2.5 text-center text-sm font-bold uppercase tracking-widest"
                style={{ backgroundColor: GOLD, color: '#000' }}
              >
                ★  With Scale Detailing  ★
              </div>

              <div className="mt-4">
                <div className="text-xs uppercase tracking-[0.25em] font-semibold mb-6" style={{ color: `${GOLD}80` }}>
                  Our Clients Typically See
                </div>

                <div className="text-7xl sm:text-9xl font-bold font-mono mb-4" style={{ color: GOLD }}>
                  <AnimatedNumber value={growthPercentage} suffix="%" duration={2} />
                </div>

                <div className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Revenue Growth
                </div>

                <div className="text-base text-muted-foreground max-w-md mx-auto mb-8">
                  From <span className="text-white font-semibold font-mono">{formatCurrency(cost.currentRevenue)}/mo</span> to{' '}
                  <span className="font-bold font-mono" style={{ color: GOLD }}>{formatCurrency(cost.goalRevenue)}/mo</span>
                </div>

                {/* Divider */}
                <div className="w-24 h-px mx-auto mb-8" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}60, transparent)` }} />

                {/* Before → After probability comparison inline */}
                <div className="flex items-center justify-center gap-6 sm:gap-10">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Today</div>
                    <div className="text-4xl sm:text-5xl font-bold font-mono" style={{ color: probColor }}>
                      {Math.round(probability.overall)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">chance of hitting goal</div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight size={28} style={{ color: GOLD }} />
                    <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: GOLD }}>With Scale</span>
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: `${GOLD}90` }}>Projected</div>
                    <div className="text-4xl sm:text-5xl font-bold font-mono" style={{ color: GOLD }}>
                      <AnimatedNumber value={projectedProbability} suffix="%" />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">chance of hitting goal</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── What We Fix — Pillar Breakdown ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  Exactly How We'll <span style={{ color: GOLD }}>Close the Gaps</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Our program addresses every area holding your business back
                </p>
              </div>

              <div className="space-y-4">
                {pillarSummaries.filter(p => p.issueCount > 0).map((p, i) => {
                  const vagueInfo = PILLAR_VAGUE_FIXES[p.id];
                  if (!vagueInfo) return null;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl border overflow-hidden"
                      style={{
                        borderColor: `${GOLD}20`,
                        background: `${GOLD}04`,
                      }}
                    >
                      {/* Pillar header */}
                      <div className="px-5 py-4 flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${GOLD}15`, color: GOLD }}
                        >
                          {vagueInfo.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-white">{p.label}</h4>
                            <span className="text-xs font-mono font-semibold text-red-400">
                              {p.issueCount} {p.issueCount === 1 ? 'gap' : 'gaps'} found
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {vagueInfo.solution}
                          </p>
                        </div>
                      </div>

                      {/* How we help — bullet points */}
                      <div
                        className="px-5 py-4 border-t"
                        style={{ borderColor: `${GOLD}10`, background: `${GOLD}06` }}
                      >
                        <div className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: `${GOLD}80` }}>
                          How We Fix This
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {vagueInfo.howWeHelp.map((item, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: GOLD }} />
                              <span className="text-xs text-white/80 leading-relaxed">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cost impact footer */}
                      {p.totalCost > 0 && (
                        <div
                          className="px-5 py-3 border-t flex items-center justify-between"
                          style={{ borderColor: 'rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.03)' }}
                        >
                          <span className="text-[10px] text-muted-foreground">Currently costing you</span>
                          <span className="text-xs font-data font-bold text-red-400">~{formatCurrency(p.totalCost)}/mo</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Social Proof / Trust Strip ── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border px-6 sm:px-8 py-6 text-center"
              style={{
                borderColor: `${GOLD}20`,
                background: `linear-gradient(135deg, ${GOLD}06, rgba(0,0,0,0.2))`,
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-4" style={{ color: `${GOLD}70` }}>
                Why Shops Choose Scale
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { value: '50+', label: 'Shops Coached' },
                  { value: '93%', label: 'Client Retention' },
                  { value: '2.4x', label: 'Avg Revenue Growth' },
                  { value: '90 Days', label: 'To See Results' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-xl sm:text-2xl font-bold font-mono" style={{ color: GOLD }}>{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION: The Cost of Doing Nothing */}
        {/* ═══════════════════════════════════════════ */}
        <Section>
          <div className="container max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
                <TrendingDown size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">What Happens If Nothing Changes</h2>
                <p className="text-xs text-muted-foreground">The real cost of staying where you are</p>
              </div>
            </div>

            {/* Big scary numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: '3 Months', value: cost.opportunityCost3Month, delay: 0 },
                { label: '6 Months', value: cost.opportunityCost6Month, delay: 0.15 },
                { label: '12 Months', value: cost.opportunityCost12Month, delay: 0.3 },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item.delay, duration: 0.5 }}
                  className="rounded-xl border px-5 py-6 text-center"
                  style={{
                    borderColor: 'rgba(239,68,68,0.15)',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.04), rgba(0,0,0,0.2))',
                  }}
                >
                  <div className="text-xs text-red-400/60 uppercase tracking-wider font-semibold mb-2">
                    {item.label}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-data text-red-400">
                    <AnimatedNumber value={item.value} prefix="$" duration={2} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">revenue left on the table</div>
                </motion.div>
              ))}
            </div>

            {/* Monthly gap callout */}
            <div
              className="rounded-xl border px-6 py-5 flex items-center gap-4"
              style={{
                borderColor: 'rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.04)',
              }}
            >
              <DollarSign size={24} className="text-red-400 shrink-0" />
              <div>
                <div className="text-sm text-white font-semibold">
                  Every month, <span className="text-red-400 font-mono">{formatCurrency(cost.monthlyGap)}</span> is slipping through the cracks
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  That's the gap between {formatCurrency(cost.currentRevenue)}/mo and your {formatCurrency(cost.goalRevenue)}/mo goal
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 3: Where the Gaps Are (VAGUE) */}
        {/* ═══════════════════════════════════════════ */}
        <Section>
          <div className="container max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${GOLD}15` }}>
                <Target size={20} style={{ color: GOLD }} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Where the Gaps Are</h2>
                <p className="text-xs text-muted-foreground">We found {issues.length} areas holding your business back</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-8 ml-[52px]">
              Here's a high-level look at the four pillars of your business and where the biggest opportunities are.
            </p>

            {/* Pillar cards — show percentage + issue count + vague description, NOT specific fixes */}
            <div className="space-y-4 mb-8">
              {pillarSummaries.map((p, i) => {
                const vagueInfo = PILLAR_VAGUE_FIXES[p.id];
                const hasIssues = p.issueCount > 0;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="rounded-xl border overflow-hidden"
                    style={{
                      borderColor: hasIssues ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                      background: hasIssues
                        ? 'linear-gradient(135deg, rgba(239,68,68,0.02), rgba(0,0,0,0.2))'
                        : 'linear-gradient(135deg, rgba(16,185,129,0.02), rgba(0,0,0,0.2))',
                    }}
                  >
                    <div className="px-5 py-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: hasIssues ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              color: hasIssues ? '#EF4444' : '#10B981',
                            }}
                          >
                            {vagueInfo?.icon || <Target size={16} />}
                          </div>
                          <h3 className="text-base font-bold text-white">{p.label}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          {hasIssues && (
                            <span className="text-xs text-red-400/70 flex items-center gap-1">
                              <AlertTriangle size={11} />
                              {p.issueCount} issue{p.issueCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span
                            className="text-sm font-bold font-mono px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: p.percentage >= 70 ? 'rgba(16,185,129,0.12)' : p.percentage >= 40 ? `${GOLD}15` : 'rgba(239,68,68,0.12)',
                              color: p.percentage >= 70 ? '#10B981' : p.percentage >= 40 ? GOLD : '#EF4444',
                            }}
                          >
                            {Math.round(p.percentage)}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 rounded-full bg-white/5 mb-4 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p.percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 }}
                          style={{
                            backgroundColor: p.percentage >= 70 ? '#10B981' : p.percentage >= 40 ? GOLD : '#EF4444',
                          }}
                        />
                      </div>

                      {/* Vague description — don't give away the playbook */}
                      {hasIssues && vagueInfo ? (
                        <div className="flex items-start gap-3">
                          <AlertTriangle size={14} className="text-red-400/50 shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {vagueInfo.problem}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-emerald-400/70">
                          <CheckCircle2 size={14} />
                          This area is looking solid — keep it up
                        </div>
                      )}

                      {/* Cost impact */}
                      {hasIssues && p.totalCost > 0 && (
                        <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/5">
                          <span className="text-xs text-muted-foreground">Estimated impact</span>
                          <span className="text-sm font-mono font-semibold text-red-400">
                            ~{formatCurrency(p.totalCost)}/mo
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Total impact summary */}
            <div
              className="rounded-xl border px-6 py-5 text-center"
              style={{
                borderColor: 'rgba(239,68,68,0.2)',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.04), rgba(0,0,0,0.3))',
              }}
            >
              <div className="text-xs text-red-400/60 uppercase tracking-wider font-semibold mb-1">
                Total Estimated Monthly Impact
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-data text-red-400">
                <AnimatedNumber value={totalMonthlyCost} prefix="$" duration={2} /><span className="text-base text-red-400/60">/mo</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 4: Growth Trajectory */}
        {/* ═══════════════════════════════════════════ */}
        <Section>
          <div className="container max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Your Growth Trajectory</h2>
                <p className="text-xs text-muted-foreground">What the next 12 months could look like</p>
              </div>
            </div>

            {/* GrowthTrajectoryChart shelved */}
          </div>
        </Section>

        {/* AD SPEND SIMULATOR SECTION REMOVED */}
        {false && <Section>
          <div className="container max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${GOLD}15` }}>
                <Megaphone size={20} style={{ color: GOLD }} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">What Your Ad Spend Could Return</h2>
                <p className="text-xs text-muted-foreground">With Scale managing your marketing</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-8 ml-[52px]">
              Drag the slider to see how different monthly ad budgets translate into leads, customers, and revenue — with our team optimizing every dollar.
            </p>

            {/* Slider Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border-2 p-6 sm:p-8 mb-6"
              style={{
                borderColor: `${GOLD}25`,
                background: `linear-gradient(135deg, ${GOLD}05, rgba(0,0,0,0.3))`,
              }}
            >
              {/* Spend Amount Display */}
              <div className="text-center mb-6">
                <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: `${GOLD}80` }}>
                  Monthly Ad Budget
                </div>
                <div className="text-5xl sm:text-6xl font-bold font-mono" style={{ color: GOLD }}>
                  ${adSpendLevel.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">per month</div>
              </div>

              {/* Slider */}
              <div className="mb-5">
                <input
                  type="range"
                  min={0}
                  max={5000}
                  step={100}
                  value={adSpendLevel}
                  onChange={(e) => setAdSpendLevel(parseInt(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${(adSpendLevel / 5000) * 100}%, rgba(255,255,255,0.06) ${(adSpendLevel / 5000) * 100}%, rgba(255,255,255,0.06) 100%)`,
                    accentColor: GOLD,
                  }}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground/40 font-mono">$0</span>
                  <span className="text-[10px] text-muted-foreground/40 font-mono">$5,000</span>
                </div>
              </div>

              {/* Preset Buttons */}
              <div className="flex gap-2 flex-wrap justify-center mb-8">
                {AD_SPEND_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setAdSpendLevel(preset)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-mono font-semibold transition-all
                      ${adSpendLevel === preset
                        ? 'text-black'
                        : 'bg-white/5 text-muted-foreground border border-white/10 hover:border-white/20 hover:text-white'
                      }
                    `}
                    style={adSpendLevel === preset ? { backgroundColor: GOLD } : {}}
                  >
                    {fmtSpend(preset)}/mo
                  </button>
                ))}
              </div>

              {/* Results Grid */}
              {adSpendLevel > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.03] p-4 text-center">
                    <div className="text-[10px] text-blue-400/60 uppercase tracking-wider font-semibold mb-2">Leads/Month</div>
                    <div className="text-2xl sm:text-3xl font-bold font-data text-blue-400">
                      <AnimatedNumber value={Math.round(adSpendProjection.totalExpectedLeads)} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatCurrency(Math.round(adSpendProjection.blendedCPL))} per lead
                    </div>
                  </div>

                  <div className="rounded-xl border border-purple-500/15 bg-purple-500/[0.03] p-4 text-center">
                    <div className="text-[10px] text-purple-400/60 uppercase tracking-wider font-semibold mb-2">New Customers</div>
                    <div className="text-2xl sm:text-3xl font-bold font-data text-purple-400">
                      <AnimatedNumber value={Math.round(adSpendProjection.totalExpectedCloses)} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {adSpendProjection.blendedCloseRate.toFixed(0)}% close rate
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4 text-center">
                    <div className="text-[10px] text-emerald-400/60 uppercase tracking-wider font-semibold mb-2">Revenue/Month</div>
                    <div className="text-2xl sm:text-3xl font-bold font-data text-emerald-400">
                      <AnimatedNumber value={adSpendProjection.totalExpectedRevenue} prefix="$" />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      from {formatCurrency(adSpendLevel)} spend
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 text-center" style={{
                    borderColor: adSpendProjection.overallROI >= 200 ? 'rgba(16,185,129,0.15)' : `${GOLD}20`,
                    background: adSpendProjection.overallROI >= 200 ? 'rgba(16,185,129,0.03)' : `${GOLD}03`,
                  }}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{
                      color: adSpendProjection.overallROI >= 200 ? 'rgba(16,185,129,0.6)' : `${GOLD}80`,
                    }}>Return on Ad Spend</div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono" style={{
                      color: adSpendProjection.overallROI >= 200 ? '#10B981' : GOLD,
                    }}>
                      <AnimatedNumber value={adSpendProjection.overallROI} suffix="%" />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      ${adSpendProjection.revenuePerDollarSpent.toFixed(2)} per $1 spent
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-8 text-center">
                  <Megaphone size={28} className="text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground/50">Drag the slider to see what your ad budget could return</p>
                </div>
              )}
            </motion.div>

            {/* Dependency Gates — What's Blocking Growth */}
            {probability.dependencyGates && probability.dependencyGates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                {/* Revenue Ceiling */}
                <div className="rounded-2xl border-2 p-6 mb-4 text-center" style={{
                  borderColor: probability.revenueCeiling < (goalRevenue || cost.goalRevenue) ? 'rgba(239,68,68,0.25)' : `${GOLD}25`,
                  background: probability.revenueCeiling < (goalRevenue || cost.goalRevenue) ? 'rgba(239,68,68,0.03)' : `${GOLD}03`,
                }}>
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: probability.revenueCeiling < (goalRevenue || cost.goalRevenue) ? 'rgba(239,68,68,0.6)' : `${GOLD}80` }}>
                    Your Current Revenue Ceiling
                  </div>
                  <div className="text-4xl sm:text-5xl font-bold font-mono mb-1" style={{ color: probability.revenueCeiling < (goalRevenue || cost.goalRevenue) ? '#EF4444' : GOLD }}>
                    {formatCurrency(probability.revenueCeiling)}
                    <span className="text-lg text-muted-foreground">/mo</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {probability.revenueCeiling < (goalRevenue || cost.goalRevenue)
                      ? <>That's <span className="text-red-400 font-semibold">{formatCurrency((goalRevenue || cost.goalRevenue) - probability.revenueCeiling)} below</span> your goal — here's why</>
                      : 'Your foundation can support your growth target'
                    }
                  </div>
                </div>

                {/* Three Ceiling Factors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
                  {[
                    { label: 'Ad Spend', value: probability.adSpendCeiling, color: '#3B82F6', isLowest: probability.adSpendCeiling === probability.revenueCeiling },
                    { label: 'Team Capacity', value: probability.capacityCeiling, color: '#8B5CF6', isLowest: probability.capacityCeiling === probability.revenueCeiling },
                    { label: 'Systems & CRM', value: probability.systemsCeiling, color: '#F59E0B', isLowest: probability.systemsCeiling === probability.revenueCeiling },
                  ].map(c => (
                    <div
                      key={c.label}
                      className="rounded-xl border p-4 text-center transition-all"
                      style={{
                        borderColor: c.isLowest ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)',
                        background: c.isLowest ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <div className="text-[9px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: c.isLowest ? '#EF4444' : 'rgba(255,255,255,0.4)' }}>
                        {c.label} {c.isLowest && '⚠️'}
                      </div>
                      <div className="text-lg sm:text-xl font-bold font-mono" style={{ color: c.isLowest ? '#EF4444' : c.color }}>
                        {formatCurrency(c.value)}<span className="text-[10px] text-muted-foreground">/mo</span>
                      </div>
                      {c.isLowest && (
                        <div className="text-[9px] text-red-400/70 mt-1 font-semibold">← Your bottleneck</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Gate Status Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {probability.dependencyGates.map(gate => (
                    <div
                      key={gate.id}
                      className={`rounded-lg p-3 border ${
                        gate.met
                          ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                          : 'border-red-500/25 bg-red-500/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${gate.met ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
                        <span className="text-[10px] font-bold text-white">{gate.label}</span>
                      </div>
                      <p className={`text-[9px] leading-relaxed ${gate.met ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                        {gate.met ? 'In place' : gate.impact}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Warnings — What's Holding You Back */}
                {probability.warnings && probability.warnings.length > 0 && (
                  <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} className="text-red-400" />
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider">What's Blocking Your Growth</span>
                    </div>
                    <div className="space-y-2">
                      {probability.warnings.map((warning, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400/50 mt-1.5 shrink-0" />
                          <p className="text-sm text-red-300/80 leading-relaxed">{warning}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-red-500/10">
                      <p className="text-xs text-muted-foreground italic">
                        Throwing more money at ads won't fix these. <span style={{ color: GOLD }} className="font-semibold not-italic">We fix the foundation first, then scale.</span>
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Bottom insight */}
            {adSpendLevel > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border px-6 py-5 flex items-center gap-4"
                style={{
                  borderColor: `${GOLD}20`,
                  background: `${GOLD}04`,
                }}
              >
                <Zap size={20} style={{ color: GOLD }} className="shrink-0" />
                <div>
                  <div className="text-sm text-white font-semibold">
                    {adSpendProjection.overallROI >= 200 ? (
                      <>Every <span className="font-mono" style={{ color: GOLD }}>$1</span> you invest returns <span className="font-data text-emerald-400">${adSpendProjection.revenuePerDollarSpent.toFixed(2)}</span> in revenue</>
                    ) : adSpendProjection.overallROI >= 100 ? (
                      <>Your ad spend is projected to <span className="text-emerald-400">more than pay for itself</span> every month</>
                    ) : (
                      <>With our optimization, we'll work to <span style={{ color: GOLD }}>maximize every dollar</span> of your ad budget</>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Projections based on industry CPL data, optimized by Scale's ad management team
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </Section>}

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 6: CTA — Ready to Scale? */}
        {/* ═══════════════════════════════════════════ */}
        <Section className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{ background: `radial-gradient(ellipse at center, ${GOLD} 0%, transparent 60%)` }}
          />

          <div className="container relative text-center max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ backgroundColor: `${GOLD}12`, border: `1px solid ${GOLD}25` }}
              >
                <Rocket size={14} style={{ color: GOLD }} />
                <span className="text-xs font-semibold" style={{ color: GOLD }}>Ready to change these numbers?</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold mb-4">
                Stop Leaving{' '}
                <span className="font-data text-red-400">
                  {formatCurrency(cost.opportunityCost12Month)}
                </span>
                <br />
                On the Table
              </h2>

              <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-lg mx-auto">
                We'll grow your revenue by{' '}
                <span className="font-bold font-mono" style={{ color: GOLD }}>{growthPercentage}%</span>
                {' '}and take your chances from{' '}
                <span className="font-mono" style={{ color: probColor }}>{Math.round(probability.overall)}%</span>
                {' '}to{' '}
                <span className="font-mono" style={{ color: GOLD }}>{projectedProbability}%</span>.
                {' '}Every month you wait is another{' '}
                <span className="text-red-400 font-mono font-semibold">{formatCurrency(totalMonthlyCost)}</span>
                {' '}gone.
              </p>

              {/* The two paths */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-10">
                <div
                  className="rounded-xl border px-5 py-5 text-left"
                  style={{
                    borderColor: 'rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.03)',
                  }}
                >
                  <div className="text-xs text-red-400/60 uppercase tracking-wider font-semibold mb-2">
                    Do Nothing
                  </div>
                  <div className="text-lg font-bold font-data text-red-400 mb-1">
                    −{formatCurrency(cost.opportunityCost12Month)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">lost over the next 12 months</div>
                  <div className="text-[10px] text-red-400/50 mt-1">
                    {Math.round(probability.overall)}% chance of hitting your goal
                  </div>
                </div>

                <div
                  className="rounded-xl border px-5 py-5 text-left relative overflow-hidden"
                  style={{
                    borderColor: `${GOLD}30`,
                    background: `${GOLD}06`,
                  }}
                >
                  <div
                    className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[9px] font-bold uppercase"
                    style={{ backgroundColor: GOLD, color: '#000' }}
                  >
                    Recommended
                  </div>
                  <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: `${GOLD}90` }}>
                    Work With Scale
                  </div>
                  <div className="text-lg font-bold font-mono mb-1" style={{ color: GOLD }}>
                    +{growthPercentage}% Growth
                  </div>
                  <div className="text-[10px] text-muted-foreground">targeted revenue increase</div>
                  <div className="text-[10px] mt-1" style={{ color: `${GOLD}70` }}>
                    {projectedProbability}% projected chance of hitting your goal
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className="h-14 px-10 text-base gap-3 rounded-xl shadow-lg"
                style={{
                  backgroundColor: GOLD,
                  color: '#000',
                  boxShadow: `0 8px 30px ${GOLD}40`,
                }}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <Rocket size={20} />
                Let's Get Started
              </Button>

              <p className="text-[10px] text-muted-foreground mt-4">
                Scale Toolkit · Powered by Scale Detailing
              </p>
            </motion.div>
          </div>
        </Section>
      </motion.div>
    </AnimatePresence>
  );
}
