/*
 * ReportView v6 — Intelligence System Report
 * 
 * Design philosophy: "Supercomputer meets consulting deck"
 * - Visually complex: HUD overlays, data grids, scanning lines, terminal-style readouts
 * - Data-dense: Every subcategory shown with weight, score, rubric description, and action items
 * - Simply explained: Every metric has a plain-English "What this means" callout
 * - Cinematic: Staggered animations, glow effects, grid backgrounds
 *
 * Sections:
 * 1. Intelligence Header — HUD-style with scanning animation
 * 2. System Overview — 6-metric command dashboard
 * 3. Probability Engine — Full variable breakdown with sigmoid visualization
 * 4. Pillar Command Center — All 4 pillars with every subcategory expanded
 * 5. Threat Matrix — Bottleneck analysis with impact calculations
 * 6. Growth Protocol — Prioritized action plan with probability impact
 * 7. Score Distribution Grid
 * 8. System Legend & Methodology
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer, ArrowLeft, Download, ChevronDown, ChevronUp, TrendingUp, Zap,
  Target, ArrowRight, Shield, BarChart3, Activity, Layers, AlertTriangle,
  CheckCircle2, XCircle, Minus, Award, Gauge, ArrowUpRight,
  Star, Flame, Trophy, Eye, Cpu, Database, Terminal, Radio,
  Crosshair, Lock, Unlock, CircleDot, Radar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBandColor, getBandLabel, getProbabilityColor, getProbabilityLabel, PILLARS, type RevenueTier } from '@/lib/sos-engine';
import { generateReportPDF } from '@/lib/generate-pdf';
import { computeCostOfNotChanging, computeTrajectoryData } from '@/lib/cost-engine';
import CostOfNotChangingSection from '@/components/CostOfNotChanging';
import BusinessProfileSummary from '@/components/BusinessProfileSummary';
import AdSpendROI from '@/components/AdSpendROI';
import GrowthSimulator from '@/components/GrowthSimulator';
import BattlePlan from '@/components/BattlePlan';
import ScalePlaybook from '@/components/ScalePlaybook';
import ProgressReview from '@/components/ProgressReview';
import { generateChangeIntelligence } from '@/lib/change-intelligence';

import type { SOSResult, SubcategoryInput, ScalingProbability } from '@/lib/sos-engine';

interface AssessmentMeta {
  shopName: string;
  assessorName: string;
  assessmentDate: string;
  notes: string;
  city?: string;
  state?: string;
}

interface ReportViewProps {
  result: SOSResult;
  inputs: Record<string, SubcategoryInput>;
  meta: AssessmentMeta;
  probability: ScalingProbability;
  onBack?: () => void;
  isCustomerView?: boolean;
  hideActionBar?: boolean;
  customerLogoUrl?: string | null;
  revenueTier?: import('@/lib/sos-engine').RevenueTier;
  customTarget?: number;
  onTierChange?: (tier: import('@/lib/sos-engine').RevenueTier, customTarget?: number) => void;
  onReplayAnimation?: () => void;
  currentRevenue?: number;
  goalRevenue?: number;
  businessProfile?: import('@shared/business-profile').BusinessProfile | null;
  // Reassessment props
  isReassessment?: boolean;
  previousInputs?: Record<string, SubcategoryInput> | null;
  previousDate?: string | null;
  previousRevenue?: number | null;
  previousBusinessProfile?: import('@shared/business-profile').BusinessProfile | null;
}

const PILLAR_ICONS = [Shield, BarChart3, Activity, Layers];
const PILLAR_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

// ─── HUD Grid Background ───
function HudGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(200,150,46,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,150,46,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(200,150,46,0.15), transparent)' }}
        initial={{ top: '-2%' }}
        animate={{ top: '102%' }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ─── Corner Brackets ───
function CornerBrackets({ color = 'rgba(200,150,46,0.2)' }: { color?: string }) {
  const style = { borderColor: color };
  return (
    <>
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l" style={style} />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r" style={style} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l" style={style} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r" style={style} />
    </>
  );
}

// ─── Animated Counter ───
function AnimatedNumber({ value, duration = 2, suffix = '', prefix = '' }: { value: number; duration?: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <>{prefix}{display}{suffix}</>;
}

// ─── Score Ring (reusable) ───
function ScoreRing({
  value, color, label, sublabel, size = 200, strokeWidth = 14, delay = 0,
}: {
  value: number; color: string; label: string; sublabel?: string;
  size?: number; strokeWidth?: number; delay?: number;
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const uid = label.replace(/[^a-zA-Z]/g, '');

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        <defs>
          <linearGradient id={`ring-g-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
          <filter id={`ring-glow-${uid}`}>
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={center} cy={center} r={radius + strokeWidth * 0.8} fill="none" stroke="rgba(200,150,46,0.06)" strokeWidth="1" />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={`url(#ring-g-${uid})`}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
          transition={{ duration: 2, ease: 'easeOut', delay }}
          transform={`rotate(-90 ${center} ${center})`}
          filter={`url(#ring-glow-${uid})`}
        />
        <text x={center} y={center - 8} textAnchor="middle" fill="white" fontFamily="'JetBrains Mono'" fontWeight="800" fontSize={size * 0.2}>
          <AnimatedNumber value={Math.round(value)} />
        </text>
        <text x={center} y={center + 12} textAnchor="middle" fill={color} fontFamily="'Space Grotesk'" fontWeight="600" fontSize={size * 0.055} letterSpacing="0.1em">
          {label.toUpperCase()}
        </text>
        {sublabel && (
          <text x={center} y={center + 28} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontFamily="'Space Grotesk'" fontSize={size * 0.04} letterSpacing="0.15em">
            {sublabel.toUpperCase()}
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── Radar Chart ───
function RadarChart({ pillars, size = 260 }: { pillars: SOSResult['pillars']; size?: number }) {
  const center = size / 2;
  const maxRadius = size * 0.36;
  const levels = 5;

  const getPoint = (index: number, value: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full max-w-[260px]">
      <defs>
        <linearGradient id="rf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C8962E" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C8962E" stopOpacity="0.05" />
        </linearGradient>
        <filter id="rg"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {Array.from({ length: levels }, (_, li) => {
        const pts = pillars.map((_, i) => {
          const pt = getPoint(i, ((li + 1) / levels) * 100, pillars.length);
          return `${pt.x},${pt.y}`;
        }).join(' ');
        return <polygon key={li} points={pts} fill="none" stroke="rgba(200,150,46,0.08)" strokeWidth={li === levels - 1 ? 1.5 : 0.5} />;
      })}
      {pillars.map((_, i) => {
        const pt = getPoint(i, 100, pillars.length);
        return <line key={i} x1={center} y1={center} x2={pt.x} y2={pt.y} stroke="rgba(200,150,46,0.1)" strokeWidth={0.5} />;
      })}
      <motion.polygon
        points={pillars.map((p, i) => { const pt = getPoint(i, p.percentage, pillars.length); return `${pt.x},${pt.y}`; }).join(' ')}
        fill="url(#rf)" stroke="#C8962E" strokeWidth={2} filter="url(#rg)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
      />
      {pillars.map((p, i) => {
        const pt = getPoint(i, p.percentage, pillars.length);
        return <motion.circle key={i} cx={pt.x} cy={pt.y} r={4} fill={getBandColor(p.band)} stroke="#0D0D0D" strokeWidth={2} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + i * 0.15, type: 'spring' }} />;
      })}
      {pillars.map((p, i) => {
        const lp = getPoint(i, 122, pillars.length);
        return (
          <g key={`l-${i}`}>
            <text x={lp.x} y={lp.y - 5} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="'Space Grotesk'" fontWeight="600" letterSpacing="0.05em">{p.label.toUpperCase()}</text>
            <text x={lp.x} y={lp.y + 8} textAnchor="middle" fill={getBandColor(p.band)} fontSize="11" fontFamily="'JetBrains Mono'" fontWeight="700">{p.percentage.toFixed(0)}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Section Header ───
function SectionHeader({ icon: Icon, title, subtitle, color = '#C8962E' }: { icon: React.ElementType; title: string; subtitle?: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative" style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
        <Icon size={18} style={{ color }} />
        <div className="absolute inset-0 rounded-xl animate-pulse" style={{ boxShadow: `0 0 15px ${color}10` }} />
      </div>
      <div className="flex-1">
        <h2 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-[0.1em]">{title}</h2>
        {subtitle && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{subtitle}</p>}
      </div>
      <div className="hidden sm:flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-gold/30 animate-pulse" />
        <span className="font-data text-[8px] text-gold/30 uppercase tracking-widest">Live</span>
      </div>
    </div>
  );
}

// ─── Insight Box (plain-English explanation) ───
function InsightBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' | 'success' }) {
  const colors = {
    info: { bg: 'rgba(200,150,46,0.04)', border: 'rgba(200,150,46,0.15)', icon: Eye, color: '#C8962E' },
    warning: { bg: 'rgba(231,76,60,0.04)', border: 'rgba(231,76,60,0.15)', icon: AlertTriangle, color: '#E74C3C' },
    success: { bg: 'rgba(46,204,113,0.04)', border: 'rgba(46,204,113,0.15)', icon: CheckCircle2, color: '#2ECC71' },
  };
  const c = colors[variant];
  const IconComp = c.icon;
  return (
    <div className="rounded-lg px-4 py-3 flex gap-3 items-start" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
      <IconComp size={14} style={{ color: c.color }} className="shrink-0 mt-0.5" />
      <div className="text-xs text-foreground/70 leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Score Badge ───
function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color = score >= 4 ? '#2ECC71' : score >= 3 ? '#8BC34A' : score >= 2 ? '#D4A843' : score >= 1 ? '#E67E22' : '#E74C3C';
  const label = score === 5 ? 'ELITE' : score === 4 ? 'GOOD' : score === 3 ? 'AVG' : score === 2 ? 'WEAK' : score <= 1 ? 'CRIT' : '—';
  const sizeClass = size === 'sm' ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-0.5';
  return (
    <span className={`font-data font-bold uppercase tracking-wider rounded-full ${sizeClass}`} style={{ color, backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
      {label}
    </span>
  );
}

// ─── Horizontal Bar ───
function ScoreBar({ score, maxScore = 5, color, delay = 0 }: { score: number; maxScore?: number; color: string; delay?: number }) {
  const pct = (score / maxScore) * 100;
  return (
    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
      <motion.div
        className="h-full rounded-full relative"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.div>
    </div>
  );
}

// ─── Get rubric description for a score ───
function getRubricDescription(pillarId: string, subId: string, score: number): string {
  const pillar = PILLARS.find(p => p.id === pillarId);
  if (!pillar) return '';
  const sub = pillar.subcategories.find(s => s.id === subId);
  if (!sub) return '';
  const level = sub.rubric.find(r => r.score === score);
  return level?.description || '';
}

// ─── Get next level rubric description ───
function getNextLevelDescription(pillarId: string, subId: string, score: number): string {
  if (score >= 5) return '';
  const pillar = PILLARS.find(p => p.id === pillarId);
  if (!pillar) return '';
  const sub = pillar.subcategories.find(s => s.id === subId);
  if (!sub) return '';
  const nextLevel = sub.rubric.find(r => r.score === score + 1);
  return nextLevel?.description || '';
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function ReportView({ result, inputs, meta, probability, onBack, isCustomerView = false, hideActionBar = false, customerLogoUrl, revenueTier, customTarget, onTierChange, onReplayAnimation, currentRevenue, goalRevenue, businessProfile, isReassessment, previousInputs, previousDate, previousRevenue, previousBusinessProfile }: ReportViewProps) {

  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(t);
  }, []);



  // Change Intelligence for reassessments
  const changeReport = useMemo(() => {
    if (!isReassessment || !previousInputs || !previousDate) return null;
    return generateChangeIntelligence(
      previousInputs,
      inputs,
      previousDate,
      meta.assessmentDate || new Date().toISOString().slice(0, 10),
      revenueTier || '20-30',
      customTarget,
      previousRevenue ?? undefined,
      currentRevenue ?? undefined,
      previousBusinessProfile,
      businessProfile,
    );
  }, [isReassessment, previousInputs, previousDate, inputs, meta.assessmentDate, revenueTier, customTarget, previousRevenue, currentRevenue, previousBusinessProfile, businessProfile]);

  const handlePrint = () => window.print();
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    try {
      await generateReportPDF(result, inputs, meta, probability, customerLogoUrl);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadJSON = () => {
    const exportData = {
      meta: { ...meta, generatedAt: new Date().toISOString() },
      percentage: result.percentage,
      band: result.band,
      scalingProbability: { overall: probability.overall, tier: probability.tierLabel, pillarContributions: probability.pillarContributions, topBlockers: probability.topBlockers },
      pillars: result.pillars.map(p => ({
        id: p.id, label: p.label, percentage: p.percentage, band: p.band,
        subcategories: p.subcategories.map(s => ({ id: s.id, label: s.label, score: s.score, weight: s.weight, weightedDeficit: s.weightedDeficit, note: inputs[s.id]?.note || '' })),
      })),
      topLeveragePriorities: result.topLeveragePriorities.map(p => ({ id: p.id, label: p.label, pillar: p.pillarLabel, gapPoints: p.gapPoints, weightedDeficit: p.weightedDeficit })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sos-report-${meta.shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${meta.assessmentDate || new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const probColor = getProbabilityColor(probability.overall);
  const scoreColor = getBandColor(result.band);

  const allSubs = result.pillars.flatMap(p => p.subcategories);
  const scoredSubs = allSubs.filter(s => s.score > 0);
  const perfectCount = allSubs.filter(s => s.score === 5).length;
  const goodCount = allSubs.filter(s => s.score === 4).length;
  const fairCount = allSubs.filter(s => s.score === 3).length;
  const weakCount = allSubs.filter(s => s.score === 2).length;
  const criticalCount = allSubs.filter(s => s.score <= 1 && s.score > 0).length;
  const unscoredCount = allSubs.filter(s => s.score === 0).length;

  const strengths = allSubs.filter(s => s.score >= 4).sort((a, b) => b.score - a.score).slice(0, 5);
  const weaknesses = allSubs.filter(s => s.score > 0 && s.score <= 2).sort((a, b) => b.weightedDeficit - a.weightedDeficit).slice(0, 5);

  const gradeLabel = result.percentage >= 90 ? 'A+' : result.percentage >= 80 ? 'A' :
    result.percentage >= 70 ? 'B' : result.percentage >= 60 ? 'C' :
    result.percentage >= 50 ? 'D' : 'F';

  // Total possible points and current
  const totalWeight = allSubs.reduce((s, sub) => s + sub.weight, 0);
  const totalGapPoints = allSubs.reduce((s, sub) => s + sub.gapPoints, 0);

  // Cost of Not Changing calculation
  const effectiveTier = revenueTier || probability.tier;
  const costOfNotChanging = useMemo(
    () => computeCostOfNotChanging(result, probability, effectiveTier, customTarget, currentRevenue, goalRevenue),
    [result, probability, effectiveTier, customTarget, currentRevenue, goalRevenue]
  );

  // Growth Trajectory chart data
  const trajectoryData = useMemo(
    () => computeTrajectoryData(costOfNotChanging, result.percentage),
    [costOfNotChanging, result.percentage]
  );

  return (
    <div className="min-h-screen bg-background relative">
      <HudGrid />

      {/* ═══ ACTION BAR ═══ */}
      {!hideActionBar && (
        <div className="print:hidden sticky top-0 z-50 border-b border-gold/10 bg-background/90 backdrop-blur-xl">
          <div className="container flex items-center justify-between h-12">
            {!isCustomerView && onBack ? (
              <Button variant="ghost" size="sm" onClick={onBack} className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft size={14} /> Back
              </Button>
            ) : (
              <div className="flex items-center gap-2.5">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png" alt="Scale Detailing" className="h-6 w-auto" />
                <div className="h-4 w-px bg-gold/20" />
                <span className="font-data text-[10px] text-gold/50 tracking-widest uppercase">SOS Assessment Report</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 mr-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse" />
                <span className="font-data text-[8px] text-[#2ECC71]/60 uppercase tracking-widest">System Active</span>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className="h-7 text-[10px] gap-1 bg-gold text-black hover:bg-gold-light disabled:opacity-60"
              >
                <Download size={10} /> {pdfGenerating ? 'Generating...' : 'Download PDF'}
              </Button>
              {!isCustomerView && (
                <Button variant="outline" size="sm" onClick={handleDownloadJSON} className="h-7 text-[10px] gap-1 border-gold/15 text-gold/60 hover:text-gold">
                  <Download size={10} /> JSON
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 text-[10px] gap-1 border-gold/15 text-gold/60 hover:text-gold">
                <Printer size={10} /> Print
              </Button>
              {onReplayAnimation && (
                <Button variant="outline" size="sm" onClick={onReplayAnimation} className="h-7 text-[10px] gap-1 border-gold/15 text-gold/60 hover:text-gold">
                  <Radar size={10} /> Replay Analysis
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container max-w-6xl py-6 sm:py-10 space-y-6 sm:space-y-8 print:py-4 print:space-y-6 relative z-10">

        {/* ═══════════════════════════════════════════════════
            SECTION 1: INTELLIGENCE HEADER
        ═══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-2xl border border-gold/15 print:break-inside-avoid"
          style={{ background: 'linear-gradient(135deg, #050505 0%, #0A0A0A 40%, #080808 100%)' }}
        >
          <CornerBrackets />
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(200,150,46,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(200,150,46,0.3) 0%, transparent 50%)',
          }} />

          {/* Top status strip */}
          <div className="border-b border-gold/8 px-5 sm:px-8 py-2 flex items-center gap-3">
            <Terminal size={10} className="text-gold/30" />
            <span className="font-data text-[8px] text-gold/30 tracking-widest uppercase">
              SOS // SCALE OPERATING SYSTEM // INTELLIGENCE REPORT // {new Date().toISOString().slice(0, 19).replace('T', ' ')}
            </span>
            <div className="flex-1" />
            <span className="font-data text-[8px] text-gold/20">v4.0</span>
          </div>

          <div className="relative p-6 sm:p-10">
            {/* Logo + Title */}
            <div className="flex items-center gap-3 mb-8">
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png" alt="Scale Detailing" className="h-10 sm:h-12 w-auto" />
              {customerLogoUrl && (
                <>
                  <div className="font-data text-[8px] text-gold/20 uppercase">×</div>
                  <div className="relative h-10 sm:h-12 w-10 sm:w-12 rounded-lg border border-gold/15 bg-white/5 overflow-hidden flex items-center justify-center">
                    <img src={customerLogoUrl} alt={meta.shopName} className="max-h-full max-w-full object-contain p-1" />
                  </div>
                </>
              )}
              <div className="h-10 w-px bg-gold/15" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">Scale Toolkit</h1>
                <p className="text-[9px] text-gold/40 uppercase tracking-[0.3em] font-mono">Business Intelligence Assessment{customerLogoUrl ? ` · Prepared for ${meta.shopName}` : ''}</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left: Business info */}
              <div className="flex-1 space-y-5">
                <div>
                  <p className="font-data text-[8px] uppercase tracking-[0.2em] text-gold/30 mb-1">Subject</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{meta.shopName || 'Untitled Shop'}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { label: 'Assessment Date', value: formatDate(meta.assessmentDate), icon: Database },
                    { label: 'Analyst', value: meta.assessorName || '—', icon: Eye },
                    { label: 'Revenue Target', value: probability.tierLabel, icon: Target },
                  ].map((item) => {
                    const IC = item.icon;
                    return (
                      <div key={item.label} className="rounded-lg border border-gold/8 bg-white/[0.01] p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <IC size={9} className="text-gold/30" />
                          <p className="font-data text-[7px] uppercase tracking-[0.15em] text-gold/30">{item.label}</p>
                        </div>
                        <p className="text-sm text-white/80 font-medium">{item.value}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Grade + Insight */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center border relative" style={{ borderColor: `${scoreColor}25`, background: `linear-gradient(135deg, ${scoreColor}12, ${scoreColor}04)` }}>
                    <span className="font-data text-2xl font-black" style={{ color: scoreColor }}>{gradeLabel}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{getBandLabel(result.band)} — {result.percentage.toFixed(0)}% Overall</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {result.percentage >= 80
                        ? 'Your business is operating at a high level. Focus on fine-tuning the remaining gaps.'
                        : result.percentage >= 60
                        ? 'Solid foundation but several areas need attention before scaling aggressively.'
                        : 'Significant operational gaps exist. Address critical areas before pursuing growth.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Score Ring */}
              <div className="shrink-0">
                <ScoreRing value={result.percentage} color={scoreColor} label="SOS Score" sublabel={getBandLabel(result.band)} size={220} strokeWidth={16} delay={0.3} />
              </div>
            </div>

            {/* Pillar summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gold/8">
              {result.pillars.map((p, i) => {
                const Icon = PILLAR_ICONS[i];
                const color = getBandColor(p.band);
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }} className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon size={11} style={{ color }} />
                        <span className="font-data text-[9px] uppercase tracking-wider text-white/40">{p.label}</span>
                      </div>
                      <span className="font-data text-xs font-bold" style={{ color }}>{p.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${p.percentage}%` }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.8 + i * 0.15 }} />
                    </div>
                    <p className="font-data text-[7px] text-white/20 mt-1">{p.subcategories.length} metrics · {p.score.toFixed(0)}/{p.maxPoints} pts</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            ABOUT THIS REPORT (Customer-facing only)
        ═══════════════════════════════════════════════════ */}
        {isCustomerView && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.12 }}
            className="rounded-2xl border border-gold/12 bg-card p-5 sm:p-6 print:break-inside-avoid relative overflow-hidden"
          >
            <CornerBrackets color="rgba(200,150,46,0.06)" />
            <div className="flex items-center gap-2 mb-3">
              <Eye size={14} className="text-gold/50" />
              <span className="font-data text-[9px] font-bold uppercase tracking-[0.12em] text-gold/50">About This Report</span>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground/60 leading-relaxed">
              <p>
                This <strong className="text-foreground/70">SOS Assessment Intelligence Report</strong> is a comprehensive analysis of your auto detailing business across 30 operational metrics grouped into 4 pillars: <strong className="text-foreground/70">Services, Sales, Advertising & Marketing, and Team</strong>. Each metric was scored by a trained Scale Detailing analyst using standardized rubrics.
              </p>
              <p>
                The <strong className="text-foreground/70">Scaling Probability</strong> uses a sigmoid model calibrated against real-world data from hundreds of detailing businesses to estimate your likelihood of reaching your revenue target. The <strong className="text-foreground/70">Growth Protocol</strong> shows exactly which improvements will have the biggest impact on that probability.
              </p>
              <p>
                This report is a snapshot in time. We recommend reassessment every 90 days to track progress and recalibrate priorities. Scores are confidential and shared only with you and your Scale Detailing consultant.
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 1.5: BUSINESS PROFILE SNAPSHOT
        ═══════════════════════════════════════════════════ */}
        {businessProfile && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.12 }} className="print:break-inside-avoid">
            <BusinessProfileSummary profile={businessProfile} />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 2: SYSTEM OVERVIEW DASHBOARD
        ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 }} className="print:break-inside-avoid">
          <SectionHeader icon={Cpu} title="System Overview" subtitle="Key performance indicators at a glance" />

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Overall Score', value: `${result.percentage.toFixed(0)}%`, sub: getBandLabel(result.band), color: scoreColor, icon: Gauge, explain: `Your business scored ${result.percentage.toFixed(0)} out of 100 across all 30 operational metrics. ${result.percentage >= 80 ? 'This is a strong score.' : result.percentage >= 60 ? 'There is room for improvement.' : 'Critical gaps need addressing.'}` },
              { label: 'Scaling Probability', value: `${probability.overall.toFixed(0)}%`, sub: `${getProbabilityLabel(probability.overall)} · ${probability.tierLabel}`, color: probColor, icon: TrendingUp, explain: `Based on your current scores, there is a ${probability.overall.toFixed(0)}% chance of successfully scaling to ${probability.tierLabel} monthly revenue.` },
              { label: 'Metrics Assessed', value: `${scoredSubs.length}/${allSubs.length}`, sub: `${perfectCount} elite · ${criticalCount} critical`, color: '#C8962E', icon: Database, explain: `${scoredSubs.length} of ${allSubs.length} subcategories were scored. ${perfectCount} received a perfect 5/5, while ${criticalCount} are at critical levels (0-1).` },
              { label: 'Strongest Pillar', value: result.pillars.reduce((a, b) => a.percentage > b.percentage ? a : b).label, sub: `${result.pillars.reduce((a, b) => a.percentage > b.percentage ? a : b).percentage.toFixed(0)}%`, color: '#2ECC71', icon: Trophy, explain: `"${result.pillars.reduce((a, b) => a.percentage > b.percentage ? a : b).label}" is your highest-performing area. This is a competitive advantage to leverage.` },
              { label: 'Biggest Opportunity', value: result.pillars.reduce((a, b) => a.percentage < b.percentage ? a : b).label, sub: `${result.pillars.reduce((a, b) => a.percentage < b.percentage ? a : b).percentage.toFixed(0)}%`, color: '#E74C3C', icon: Crosshair, explain: `"${result.pillars.reduce((a, b) => a.percentage < b.percentage ? a : b).label}" has the most room for improvement. Focusing here will have the biggest impact on your overall score.` },
              { label: 'Gap to Perfect', value: `${totalGapPoints.toFixed(0)} pts`, sub: `${(100 - result.percentage).toFixed(0)}% remaining`, color: '#D4A843', icon: Target, explain: `You're ${totalGapPoints.toFixed(0)} weighted points away from a perfect score. The Growth Protocol below shows exactly where to recover these points.` },
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div key={metric.label} initial={{ opacity: 0, y: 10 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 + i * 0.06 }}
                  className="rounded-xl border border-border/15 bg-card p-4 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[50px] opacity-5" style={{ backgroundColor: metric.color }} />
                  <CornerBrackets color={`${metric.color}10`} />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${metric.color}12` }}>
                        <Icon size={13} style={{ color: metric.color }} />
                      </div>
                      <span className="font-data text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50">{metric.label}</span>
                    </div>
                    <p className="font-data text-xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: metric.color }}>{metric.sub}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-2 leading-relaxed">{metric.explain}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            SECTION 3: GROWTH SIMULATOR (merged Probability + What-If + Ad Spend)
        ═══════════════════════════════════════════════════ */}
        <GrowthSimulator
          inputs={inputs}
          result={result}
          probability={probability}
          revenueTier={effectiveTier}
          customTarget={customTarget}
          onTierChange={onTierChange}
          businessProfile={businessProfile}
          animateIn={animateIn}
        />


        {/* ═══════════════════════════════════════════════════
            SECTION 3.5: COST OF NOT CHANGING
        ═══════════════════════════════════════════════════ */}
        <CostOfNotChangingSection
          cost={costOfNotChanging}
          trajectory={trajectoryData}
          animateIn={animateIn}
          isCustomerView={isCustomerView}
        />

        {/* Ad Spend ROI now integrated into Growth Simulator above */}

        {/* ═══════════════════════════════════════════════════
            SECTION 4: STRENGTHS & CRITICAL GAPS
        ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:break-inside-avoid"
        >
          {/* Strengths */}
          <div className="rounded-xl border border-[#2ECC71]/15 bg-card p-5 relative overflow-hidden">
            <CornerBrackets color="rgba(46,204,113,0.15)" />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                <Star size={15} className="text-[#2ECC71]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Key Strengths</h3>
                <p className="text-[9px] text-muted-foreground/50">Areas performing at or above target</p>
              </div>
            </div>
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg bg-[#2ECC71]/[0.03] border border-[#2ECC71]/8 px-3 py-2.5">
                    <CheckCircle2 size={13} className="text-[#2ECC71] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{s.label}</p>
                      <p className="text-[8px] text-muted-foreground/40 font-mono">{s.pillarLabel} · Weight: {s.weight}</p>
                    </div>
                    <span className="font-data text-sm font-bold text-[#2ECC71] shrink-0">{s.score}/5</span>
                  </div>
                ))}
                <InsightBox variant="success">
                  These are your competitive advantages. Maintain these standards and use them as benchmarks when improving weaker areas.
                </InsightBox>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/40 italic py-2">No high-scoring areas yet — focus on building foundational strengths.</p>
            )}
          </div>

          {/* Weaknesses */}
          <div className="rounded-xl border border-[#E74C3C]/15 bg-card p-5 relative overflow-hidden">
            <CornerBrackets color="rgba(231,76,60,0.15)" />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E74C3C]/10 flex items-center justify-center">
                <AlertTriangle size={15} className="text-[#E74C3C]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Critical Gaps</h3>
                <p className="text-[9px] text-muted-foreground/50">Highest-impact areas needing immediate attention</p>
              </div>
            </div>
            {weaknesses.length > 0 ? (
              <div className="space-y-2">
                {weaknesses.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg bg-[#E74C3C]/[0.03] border border-[#E74C3C]/8 px-3 py-2.5">
                    <XCircle size={13} className="text-[#E74C3C] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{s.label}</p>
                      <p className="text-[8px] text-muted-foreground/40 font-mono">{s.pillarLabel} · Weight: {s.weight} · Deficit: {s.weightedDeficit.toFixed(1)}</p>
                    </div>
                    <span className="font-data text-sm font-bold text-[#E74C3C] shrink-0">{s.score}/5</span>
                  </div>
                ))}
                <InsightBox variant="warning">
                  These areas are actively holding back your growth. Each point of improvement here has an outsized impact on your scaling probability.
                </InsightBox>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/40 italic py-2">No critical gaps found — great job maintaining baseline standards.</p>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            SECTION 5: GROWTH PROTOCOL
        ═══════════════════════════════════════════════════ */}
        {probability.topBlockers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.35 }}
            className="rounded-2xl border border-gold/15 bg-card overflow-hidden print:break-inside-avoid"
          >
            <div className="px-6 sm:px-8 py-4 border-b border-gold/8 bg-gradient-to-r from-gold/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                  <TrendingUp size={18} className="text-gold" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-[0.08em]">Growth Protocol</h2>
                  <p className="text-[9px] text-muted-foreground/50 font-mono">Impact-ranked improvements · Probability simulation</p>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <InsightBox>
                <strong>How to read this:</strong> Each row shows a specific area where improvement would increase your scaling probability. The "Impact" column shows how much your probability would jump if you brought that area to a perfect 5/5 score. Focus on the top items first — they give you the most return for your effort.
              </InsightBox>

              <div className="space-y-3 mt-4">
                {probability.topBlockers.map((blocker, i) => {
                  const nextDesc = getNextLevelDescription(
                    allSubs.find(s => s.id === blocker.id)?.pillarId || '',
                    blocker.id,
                    blocker.currentScore
                  );
                  return (
                    <motion.div key={blocker.id} initial={{ opacity: 0, x: -20 }} animate={animateIn ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4 + i * 0.1 }}
                      className="rounded-xl border border-border/15 bg-gradient-to-r from-muted/5 to-transparent p-4 sm:p-5 relative overflow-hidden"
                    >
                      <CornerBrackets color="rgba(200,150,46,0.08)" />
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                          <span className="font-data text-sm font-bold text-gold">#{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">{blocker.label}</span>
                            <span className="font-data text-[8px] uppercase tracking-wider text-muted-foreground/40 px-2 py-0.5 rounded-full bg-muted/15 border border-border/8">
                              {blocker.pillarLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-muted-foreground/60">
                              Current: <span className="font-data font-bold text-[#E74C3C]">{blocker.currentScore}/5</span>
                            </span>
                            <ArrowRight size={11} className="text-gold/40" />
                            <span className="text-xs text-muted-foreground/60">
                              Target: <span className="font-data font-bold text-[#2ECC71]">5/5</span>
                            </span>
                          </div>
                          {nextDesc && (
                            <div className="mt-2.5 rounded-lg bg-gold/[0.03] border border-gold/8 px-3 py-2">
                              <p className="font-data text-[8px] text-gold/40 uppercase tracking-wider mb-1">Next Level Action</p>
                              <p className="text-[11px] text-foreground/60 leading-relaxed">{nextDesc}</p>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="font-data text-xs text-muted-foreground/40">{probability.overall.toFixed(0)}%</span>
                            <ArrowUpRight size={14} className="text-gold" />
                            <span className="font-data text-lg font-bold text-[#2ECC71]">{blocker.improvedProb.toFixed(0)}%</span>
                          </div>
                          <p className="font-data text-[9px] text-gold/50 mt-0.5 font-semibold">+{blocker.impact.toFixed(1)} pts</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Pillar Command Center & Data Matrix removed — detail available in assessment view */}

        {/* ═══════════════════════════════════════════════════
            SECTION 6.7: 30-DAY BATTLE PLAN
        ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.44 }}>
          <BattlePlan
            inputs={inputs}
            overallPercentage={result.percentage}
            scalingProbability={probability.overall}
            shopName={meta.shopName}
            revenueTier={effectiveTier}
            currentRevenue={currentRevenue}
            goalRevenue={goalRevenue}
            businessProfile={businessProfile}
          />
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            SECTION 6.8: SCALE'S PLAYBOOK (AI)
        ═══════════════════════════════════════════════════ */}
        {!isCustomerView && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.445 }}>
            <ScalePlaybook
              scores={inputs}
              revenueTier={effectiveTier}
              overallPercentage={result.percentage}
              scalingProbability={probability.overall}
              shopName={meta.shopName}
            />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 7: SCORE DISTRIBUTION
        ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.45 }}
          className="rounded-2xl border border-border/20 bg-card p-6 sm:p-8 print:break-inside-avoid relative overflow-hidden"
        >
          <CornerBrackets />
          <SectionHeader icon={BarChart3} title="Score Distribution" subtitle="How your 30 metrics are distributed across performance levels" />

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {[
              { label: 'Elite', count: perfectCount, color: '#2ECC71', range: '5/5', icon: Trophy, desc: 'Best-in-class performance' },
              { label: 'Good', count: goodCount, color: '#8BC34A', range: '4/5', icon: CheckCircle2, desc: 'Above average, minor tweaks' },
              { label: 'Fair', count: fairCount, color: '#D4A843', range: '3/5', icon: Minus, desc: 'Adequate but room to grow' },
              { label: 'Weak', count: weakCount, color: '#E67E22', range: '2/5', icon: AlertTriangle, desc: 'Below standard, needs work' },
              { label: 'Critical', count: criticalCount, color: '#E74C3C', range: '0–1/5', icon: XCircle, desc: 'Severely lacking' },
              { label: 'Unscored', count: unscoredCount, color: '#555', range: '—', icon: CircleDot, desc: 'Not yet assessed' },
            ].map((bucket) => {
              const BIcon = bucket.icon;
              return (
                <div key={bucket.label} className="text-center">
                  <div className="rounded-xl border p-3 relative overflow-hidden" style={{ borderColor: `${bucket.color}12`, backgroundColor: `${bucket.color}04` }}>
                    <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000" style={{ backgroundColor: `${bucket.color}08`, height: `${allSubs.length > 0 ? (bucket.count / allSubs.length) * 100 : 0}%` }} />
                    <div className="relative">
                      <BIcon size={14} style={{ color: bucket.color }} className="mx-auto mb-1.5 opacity-50" />
                      <p className="font-data text-2xl font-bold" style={{ color: bucket.color }}>{bucket.count}</p>
                      <p className="font-data text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40 mt-1">{bucket.label}</p>
                      <p className="text-[7px] text-muted-foreground/25 mt-0.5">{bucket.range}</p>
                    </div>
                  </div>
                  <p className="text-[8px] text-muted-foreground/30 mt-1.5 leading-tight">{bucket.desc}</p>
                </div>
              );
            })}
          </div>

          <InsightBox>
            <strong>Distribution analysis:</strong> {perfectCount + goodCount > allSubs.length * 0.5
              ? `Over half your metrics are at Good or Elite level — strong operational foundation.`
              : weakCount + criticalCount > allSubs.length * 0.3
              ? `${weakCount + criticalCount} metrics are at Weak or Critical level — this is a significant drag on your scaling probability.`
              : `Your scores are distributed across the middle range — consistent improvement across all areas will compound into major gains.`
            }
          </InsightBox>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            SECTION 8: METHODOLOGY & LEGEND
        ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:break-inside-avoid"
        >
          <div className="rounded-xl border border-border/12 bg-card p-4 relative overflow-hidden">
            <CornerBrackets color="rgba(200,150,46,0.06)" />
            <p className="font-data text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 mb-2.5">Overall Score Bands</p>
            <div className="space-y-2">
              {[
                { color: '#2ECC71', label: 'Healthy', range: '80–100%', desc: 'Ready to scale aggressively' },
                { color: '#D4A843', label: 'Needs Attention', range: '60–79%', desc: 'Fix gaps before scaling' },
                { color: '#E74C3C', label: 'Critical', range: '< 60%', desc: 'Foundational work needed' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-xs text-foreground/70 font-medium">{item.label}: {item.range}</span>
                    <p className="text-[9px] text-muted-foreground/35">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border/12 bg-card p-4 relative overflow-hidden">
            <CornerBrackets color="rgba(200,150,46,0.06)" />
            <p className="font-data text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 mb-2.5">Scaling Probability</p>
            <div className="space-y-2">
              {[
                { color: '#2ECC71', label: 'Strong', range: '70%+', desc: 'High confidence in reaching target' },
                { color: '#D4A843', label: 'Moderate', range: '45–69%', desc: 'Achievable with focused effort' },
                { color: '#E74C3C', label: 'Challenging', range: '< 45%', desc: 'Major improvements required' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-xs text-foreground/70 font-medium">{item.label}: {item.range}</span>
                    <p className="text-[9px] text-muted-foreground/35">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border/12 bg-card p-4 relative overflow-hidden">
            <CornerBrackets color="rgba(200,150,46,0.06)" />
            <p className="font-data text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 mb-2.5">Methodology</p>
            <div className="space-y-1.5 text-[11px] text-muted-foreground/50">
              <p>30 weighted subcategories across 4 pillars</p>
              <p>Each scored 0–5 with detailed rubrics</p>
              <p>Weights reflect real-world impact on scaling</p>
              <p>Sigmoid probability model with tier calibration</p>
              <p>Critical pillar penalties prevent false confidence</p>
              <p>Bottleneck analysis ranks by weighted deficit</p>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            WHAT'S NEXT (Customer-facing only)
        ═══════════════════════════════════════════════════ */}
        {isCustomerView && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={animateIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.55 }}
            className="rounded-2xl border-2 border-gold/20 bg-gradient-to-br from-gold/[0.04] to-transparent p-6 sm:p-8 print:break-inside-avoid relative overflow-hidden"
          >
            <CornerBrackets />
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/10 border border-gold/15">
                <Crosshair size={24} className="text-gold" />
              </div>
              <h3 className="text-lg font-bold text-foreground">What Happens Next?</h3>
              <div className="max-w-xl mx-auto space-y-3 text-left">
                {[
                  { step: '1', title: 'Review Your Growth Protocol', desc: 'The prioritized action items above show exactly where to focus. Start with #1 — it has the highest impact on your scaling probability.' },
                  { step: '2', title: 'Set 90-Day Goals', desc: 'Pick 3-5 subcategories to improve this quarter. Moving each one up by just 1 point compounds into significant overall improvement.' },
                  { step: '3', title: 'Schedule Your Reassessment', desc: 'In 90 days, we\'ll reassess to measure progress, celebrate wins, and recalibrate your next priorities.' },
                  { step: '4', title: 'Track Revenue Impact', desc: 'As your SOS score improves, monitor how it correlates with revenue growth. The data tells the story.' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                      <span className="font-data text-xs font-bold text-gold">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/30 pt-2">
                Questions about your report? Reach out to your Scale Detailing consultant or <a href="https://link.omniscalesystems.com/widget/bookings/scaleroadmapcallhmt7g2" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold">book a call</a>.
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            PROGRESS REVIEW (Reassessment Only)
        ═══════════════════════════════════════════════════ */}
        {changeReport && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative rounded-2xl border border-gold/10 bg-card/50 p-6 sm:p-8"
          >
            <CornerBrackets />
            <ProgressReview report={changeReport} isCustomerView={isCustomerView} />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════ */}
        <div className="border-t border-gold/6 pt-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png" alt="Scale Detailing" className="h-7 w-auto opacity-15" />
            {customerLogoUrl && (
              <>
                <span className="text-[8px] text-gold/10">×</span>
                <img src={customerLogoUrl} alt={meta.shopName} className="h-7 w-auto opacity-20" />
              </>
            )}
          </div>
          <p className="font-data text-[8px] text-muted-foreground/20 uppercase tracking-[0.3em]">
            Scale Toolkit · SOS Assessment · Confidential
          </p>
          <p className="font-data text-[7px] text-muted-foreground/12 mt-1.5">
            {formatDate(meta.assessmentDate)} · {meta.assessorName} · Powered by Scale Detailing
          </p>
        </div>
      </div>
    </div>
  );
}
