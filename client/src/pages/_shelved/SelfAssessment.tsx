/**
 * SelfAssessment — Public Lead Magnet Self-Assessment (v2)
 *
 * Styled to match the internal assessment tool:
 * - 0–5 numbered score buttons with color coding
 * - Pillar-by-pillar cards (3 questions each = 12 total)
 * - Progress header, gate form, results with pillar bars
 *
 * No authentication required. Leads stored in `leads` table.
 */
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, BarChart3, ArrowRight,
  CheckCircle2, AlertTriangle, XCircle, Loader2,
  Phone, Mail, User, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

// ─── Feature Flag ───
export const SELF_ASSESSMENT_ENABLED = true;

// ─── Portal Pillars — 3 questions each ───────────────────────────────────────
const PORTAL_PILLARS = [
  {
    id: 'services',
    label: 'Services',
    icon: '🔧',
    questions: [
      {
        id: 'services-quality',
        label: 'Service Quality',
        description: 'How consistent and high-quality is the work that leaves your shop?',
      },
      {
        id: 'services-pricing',
        label: 'Pricing Strategy',
        description: 'Is your service menu priced for profitability, not just competitiveness?',
      },
      {
        id: 'services-capacity',
        label: 'Shop Capacity',
        description: 'Are you consistently using most of your available bay time each week?',
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: '💼',
    questions: [
      {
        id: 'sales-conversion',
        label: 'Lead Conversion',
        description: 'What percentage of people who inquire actually become paying customers?',
      },
      {
        id: 'sales-reviews',
        label: 'Online Reviews',
        description: 'How strong is your Google / review presence in your market?',
      },
      {
        id: 'sales-retention',
        label: 'Customer Retention',
        description: 'How often do past customers come back for repeat services?',
      },
    ],
  },
  {
    id: 'ads',
    label: 'Marketing',
    icon: '📢',
    questions: [
      {
        id: 'ads-presence',
        label: 'Online Presence',
        description: 'How easily can potential customers find you on Google and social media?',
      },
      {
        id: 'ads-paid',
        label: 'Paid Advertising',
        description: 'Are you running paid ads that consistently bring in qualified leads?',
      },
      {
        id: 'ads-website',
        label: 'Website Performance',
        description: 'Does your website turn visitors into bookings and phone calls?',
      },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: '👥',
    questions: [
      {
        id: 'team-training',
        label: 'Team Training',
        description: 'Do your techs have structured training and clear performance standards?',
      },
      {
        id: 'team-retention',
        label: 'Staff Retention',
        description: 'How well are you keeping your best employees long-term?',
      },
      {
        id: 'team-leadership',
        label: 'Leadership',
        description: 'Do you have clear systems so the shop runs well without you present?',
      },
    ],
  },
] as const;

// ─── Score Config ─────────────────────────────────────────────────────────────
const SCORE_CONFIG: Record<number, { active: string; label: string }> = {
  0: { active: 'bg-[#E74C3C] border-[#E74C3C] text-white', label: 'None' },
  1: { active: 'bg-[#E67E22] border-[#E67E22] text-white', label: 'Poor' },
  2: { active: 'bg-[#D4A843] border-[#D4A843] text-black', label: 'Low' },
  3: { active: 'bg-[#8BC34A] border-[#8BC34A] text-black', label: 'Avg' },
  4: { active: 'bg-[#4CAF50] border-[#4CAF50] text-white', label: 'Good' },
  5: { active: 'bg-[#2ECC71] border-[#2ECC71] text-white', label: 'Elite' },
};

const BAND_COLOR: Record<string, string> = {
  green: '#2ECC71',
  yellow: '#D4A843',
  red: '#E74C3C',
};

const BAND_LABEL: Record<string, string> = {
  green: 'Strong',
  yellow: 'Developing',
  red: 'Needs Work',
};

// ─── Scoring ──────────────────────────────────────────────────────────────────
type ScoreMap = Record<string, number>;

interface PillarScore {
  id: string;
  label: string;
  icon: string;
  percentage: number;
  band: 'green' | 'yellow' | 'red';
  avgScore: number;
}

interface PortalResult {
  overall: number;
  band: 'green' | 'yellow' | 'red';
  pillarScores: PillarScore[];
  bottlenecks: Array<{ id: string; label: string; pillarLabel: string; score: number }>;
  scalingPct: number;
}

function computePortalResult(scores: ScoreMap): PortalResult {
  const pillarScores: PillarScore[] = PORTAL_PILLARS.map((pillar) => {
    const vals = pillar.questions.map((q) => scores[q.id] ?? 0);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const pct = Math.round((avg / 5) * 1000) / 10;
    const band: PillarScore['band'] = pct >= 65 ? 'green' : pct >= 35 ? 'yellow' : 'red';
    return { id: pillar.id, label: pillar.label, icon: pillar.icon, percentage: pct, band, avgScore: avg };
  });

  const overall = Math.round(
    (pillarScores.reduce((s, p) => s + p.percentage, 0) / pillarScores.length) * 10,
  ) / 10;
  const band: PortalResult['band'] = overall >= 65 ? 'green' : overall >= 35 ? 'yellow' : 'red';

  // Bottlenecks: lowest-scored questions
  const allQ = PORTAL_PILLARS.flatMap((pillar) =>
    pillar.questions.map((q) => ({
      id: q.id,
      label: q.label,
      pillarLabel: pillar.label,
      score: scores[q.id] ?? 0,
    })),
  );
  const bottlenecks = [...allQ].sort((a, b) => a.score - b.score).slice(0, 3);

  // Rough scaling probability estimate based on overall score
  const scalingPct = Math.min(95, Math.max(5, Math.round(overall * 0.9 + Math.random() * 3)));

  return { overall, band, pillarScores, bottlenecks, scalingPct };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreButton({
  seg,
  isActive,
  onClick,
}: {
  seg: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const cfg = SCORE_CONFIG[seg];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-0.5
        h-12 rounded-md border transition-all duration-150 cursor-pointer
        ${isActive
          ? `${cfg.active} shadow-sm`
          : 'border-border/40 bg-muted/30 text-muted-foreground hover:border-gold/40 hover:text-foreground'}
      `}
    >
      <span className="font-mono text-sm font-bold leading-none">{seg}</span>
      <span className={`text-[8px] leading-none font-medium ${isActive ? 'opacity-90' : 'opacity-60'}`}>
        {cfg.label}
      </span>
    </button>
  );
}

function QuestionCard({
  question,
  score,
  onScore,
}: {
  question: { id: string; label: string; description: string };
  score: number | undefined;
  onScore: (score: number) => void;
}) {
  const active = score !== undefined;
  return (
    <div
      className={`rounded-lg border bg-card/50 p-4 transition-all ${
        active ? 'border-gold/30 bg-card/80' : 'border-border/60'
      }`}
    >
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-foreground leading-tight">{question.label}</h4>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{question.description}</p>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {[0, 1, 2, 3, 4, 5].map((seg) => (
          <ScoreButton
            key={seg}
            seg={seg}
            isActive={active && seg === score}
            onClick={() => onScore(seg)}
          />
        ))}
      </div>
      {active && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          <span className="font-semibold" style={{ color: SCORE_CONFIG[score!]?.active.includes('white') ? undefined : '#000' }}>
            {score}/5
          </span>{' '}
          — {SCORE_CONFIG[score!]?.label}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SelfAssessment() {
  const [step, setStep] = useState<'intro' | 'assess' | 'gate' | 'results'>('intro');
  const [pillarIdx, setPillarIdx] = useState(0);
  const [shopName, setShopName] = useState('');
  const [scores, setScores] = useState<ScoreMap>({});

  // Gate
  const [gateName, setGateName] = useState('');
  const [gateEmail, setGateEmail] = useState('');
  const [gatePhone, setGatePhone] = useState('');
  const [gateError, setGateError] = useState('');

  const submitLead = trpc.leads.submit.useMutation();

  const currentPillar = PORTAL_PILLARS[pillarIdx];
  const totalQuestions = PORTAL_PILLARS.reduce((s, p) => s + p.questions.length, 0);
  const answeredTotal = Object.keys(scores).length;
  const answeredInPillar = currentPillar.questions.filter((q) => q.id in scores).length;

  const handleScore = useCallback((id: string, val: number) => {
    setScores((prev) => ({ ...prev, [id]: val }));
  }, []);

  const result = useMemo(() => computePortalResult(scores), [scores]);

  // ─── Gate submit ─────────────────────────────────────────────────────────────
  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    if (!gateName.trim()) { setGateError('Please enter your name.'); return; }
    if (!gateEmail.trim() || !/\S+@\S+\.\S+/.test(gateEmail)) { setGateError('Please enter a valid email.'); return; }
    if (!gatePhone.trim() || gatePhone.replace(/\D/g, '').length < 7) { setGateError('Please enter a valid phone number.'); return; }

    try {
      await submitLead.mutateAsync({
        name: gateName.trim(),
        email: gateEmail.trim(),
        phone: gatePhone.trim(),
        shopName: shopName.trim() || undefined,
        scores: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, { score: v }])),
        overallPercentage: result.overall,
        pillarResults: result.pillarScores.map((p) => ({
          id: p.id,
          label: p.label,
          percentage: p.percentage,
          band: p.band,
        })),
        source: 'self-assessment',
      });
      setStep('results');
    } catch (err: unknown) {
      setGateError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // INTRO
  // ──────────────────────────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 mb-4">
              <BarChart3 size={28} className="text-gold" />
            </div>
            <h1 className="font-display text-4xl tracking-wider text-foreground mb-2">
              SOS <span className="text-gold">SCORECARD</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Answer 12 questions across 4 pillars to get your free business health score
              and discover your top growth opportunities.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4">
            {/* Shop name input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Shop Name{' '}
                <span className="text-muted-foreground/40 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Elite Auto Spa"
                className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>

            {/* Pillar overview */}
            <div className="grid grid-cols-2 gap-2">
              {PORTAL_PILLARS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/10 px-3 py-2"
                >
                  <span className="text-base">{p.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground">3 questions</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-gold/20 bg-gold/5 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                <span className="text-gold font-semibold">Free · 3 minutes</span> — Score 0–5
                on each area. Be honest — your results will only be as useful as your answers.
              </p>
            </div>

            <Button
              onClick={() => setStep('assess')}
              className="w-full h-11 bg-gold text-black font-bold hover:bg-gold/90"
            >
              Start Assessment <ArrowRight size={16} className="ml-2" />
            </Button>
            <p className="text-[9px] text-muted-foreground/40 text-center">
              No account required. Your results are private.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // GATE
  // ──────────────────────────────────────────────────────────────────────────────
  if (step === 'gate') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold/10 border border-gold/30 mb-4">
              <BarChart3 size={24} className="text-gold" />
            </div>
            <h2 className="font-display text-3xl tracking-wider text-foreground mb-2">
              RESULTS READY
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Enter your contact info to unlock your SOS score, pillar breakdown, and top
              growth priorities.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-6">
            <form onSubmit={handleGateSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Your Name *
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={gateName}
                    onChange={(e) => setGateName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full rounded-lg border border-border/60 bg-background/50 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="email"
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    placeholder="john@eliteautospa.com"
                    className="w-full rounded-lg border border-border/60 bg-background/50 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="tel"
                    value={gatePhone}
                    onChange={(e) => setGatePhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg border border-border/60 bg-background/50 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                    required
                  />
                </div>
              </div>

              {/* Shop name (re-confirm) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Shop Name{' '}
                  <span className="text-muted-foreground/40 font-normal normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Elite Auto Spa"
                    className="w-full rounded-lg border border-border/60 bg-background/50 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                  />
                </div>
              </div>

              {gateError && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {gateError}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitLead.isPending}
                className="w-full h-11 bg-gold text-black font-bold hover:bg-gold/90 disabled:opacity-50"
              >
                {submitLead.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Calculating Score...
                  </>
                ) : (
                  <>
                    Unlock My Score <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>

              <p className="text-[9px] text-muted-foreground/40 text-center">
                A Scale Detailing specialist may reach out to discuss your results. No spam — ever.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // RESULTS
  // ──────────────────────────────────────────────────────────────────────────────
  if (step === 'results') {
    const { overall, band, pillarScores, bottlenecks } = result;
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl py-8 space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="font-display text-3xl tracking-wider text-foreground mb-1">
                YOUR SOS SCORE{shopName ? `: ${shopName.toUpperCase()}` : ''}
              </h1>
              <p className="text-sm text-muted-foreground">
                Self-assessment across {answeredTotal} of {totalQuestions} areas
              </p>
            </div>

            {/* Overall score */}
            <div className="rounded-xl border border-border/60 bg-card/50 p-6 text-center">
              <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-2">
                Overall Score
              </p>
              <p
                className="text-7xl font-bold font-mono"
                style={{ color: BAND_COLOR[band] }}
              >
                {overall.toFixed(0)}%
              </p>
              <p className="text-sm mt-1 font-semibold" style={{ color: BAND_COLOR[band] }}>
                {BAND_LABEL[band]}
              </p>
            </div>

            {/* Pillar breakdown */}
            <div className="rounded-xl border border-border/60 bg-card/50 p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 border-l-2 border-gold pl-3">
                Pillar Breakdown
              </h3>
              <div className="space-y-3">
                {pillarScores.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-sm w-5">{p.icon}</span>
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{p.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: BAND_COLOR[p.band] }}
                      />
                    </div>
                    <span
                      className="font-mono text-xs font-bold w-10 text-right"
                      style={{ color: BAND_COLOR[p.band] }}
                    >
                      {p.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 3 priorities */}
            <div className="rounded-xl border border-border/60 bg-card/50 p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 border-l-2 border-gold pl-3">
                Your Top 3 Growth Priorities
              </h3>
              <div className="space-y-2">
                {bottlenecks.map((b, i) => (
                  <div
                    key={b.id}
                    className="flex items-start gap-3 rounded-lg border border-border/20 bg-background/30 p-3"
                  >
                    <span className="font-mono text-xs font-bold text-gold mt-0.5">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{b.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {b.pillarLabel} · Score: {b.score}/5 — Improving this has the highest
                        impact on your revenue and scale.
                      </p>
                    </div>
                    <div className="mt-0.5">
                      {b.score <= 1 ? (
                        <XCircle size={16} className="text-red-400" />
                      ) : b.score <= 3 ? (
                        <AlertTriangle size={16} className="text-yellow-400" />
                      ) : (
                        <CheckCircle2 size={16} className="text-green-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-xl border-2 border-gold/40 bg-gold/5 p-6 text-center">
              <h3 className="font-display text-2xl tracking-wider text-foreground mb-2">
                READY TO FIX THESE GAPS?
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                A full professional SOS assessment includes detailed action plans, revenue
                projections, bottleneck analysis, and a personalized 90-day growth roadmap.
                Our team will reach out to schedule your free strategy call.
              </p>
              <Button
                className="h-11 px-8 bg-gold text-black font-bold hover:bg-gold/90 text-sm"
                onClick={() => window.open('https://link.omniscalesystems.com/widget/bookings/scaleroadmapcallhmt7g2', '_blank')}
              >
                Book a Free Strategy Call <ArrowRight size={16} className="ml-2" />
              </Button>
              <p className="text-[9px] text-muted-foreground/40 mt-3">
                Scale Detailing members get unlimited professional assessments included.
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ASSESSMENT — pillar by pillar
  // ──────────────────────────────────────────────────────────────────────────────
  const isLastPillar = pillarIdx === PORTAL_PILLARS.length - 1;
  const canProceed = answeredInPillar === currentPillar.questions.length;

  return (
    <div className="min-h-screen bg-background">

      {/* Sticky progress header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="container max-w-2xl flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <span className="text-base">{currentPillar.icon}</span>
            <span className="text-xs font-bold text-foreground">{currentPillar.label}</span>
            <span className="text-[10px] text-muted-foreground">
              ({pillarIdx + 1}/{PORTAL_PILLARS.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {answeredTotal}/{totalQuestions}
            </span>
            <div className="w-24 h-1.5 rounded-full bg-muted/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gold transition-all duration-300"
                style={{ width: `${(answeredTotal / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pillar questions */}
      <main className="container max-w-2xl py-6 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={pillarIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* Pillar card header */}
            <div className="rounded-xl border border-border/60 bg-card/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{currentPillar.icon}</span>
                <div>
                  <h2 className="text-base font-bold text-foreground">{currentPillar.label}</h2>
                  <p className="text-[10px] text-muted-foreground">
                    {answeredInPillar}/{currentPillar.questions.length} answered ·
                    Score each area 0 (none) to 5 (elite)
                  </p>
                </div>
              </div>

              {/* Score legend strip */}
              <div className="flex gap-1 mt-3">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className={`flex-1 rounded text-center py-0.5 text-[8px] font-bold ${SCORE_CONFIG[n].active}`}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>

            {/* Questions */}
            {currentPillar.questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                score={scores[q.id]}
                onScore={(val) => handleScore(q.id, val)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => setPillarIdx(Math.max(0, pillarIdx - 1))}
            disabled={pillarIdx === 0}
            className="h-10 px-4 text-sm gap-2 border-border/40"
          >
            <ChevronLeft size={16} /> Back
          </Button>

          {!isLastPillar ? (
            <Button
              onClick={() => setPillarIdx(pillarIdx + 1)}
              disabled={!canProceed}
              className="h-10 px-5 text-sm gap-2 bg-gold text-black hover:bg-gold/90 disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={() => setStep('gate')}
              disabled={!canProceed}
              className="h-10 px-5 text-sm gap-2 bg-gold text-black hover:bg-gold/90 disabled:opacity-40"
            >
              See My Score <BarChart3 size={16} />
            </Button>
          )}
        </div>

        {!canProceed && (
          <p className="text-center text-[10px] text-muted-foreground">
            Rate all {currentPillar.questions.length} areas to continue
          </p>
        )}
      </main>
    </div>
  );
}
