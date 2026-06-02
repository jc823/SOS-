/*
 * CalculationBoard — Supercomputer-style processing animation
 * Plays after the assessor hits "Save Assessment" before revealing the report.
 *
 * Stages:
 * 1. BOOT — System initialization with flickering terminal text
 * 2. INTAKE — Data scanning animation showing subcategory data streaming in
 * 3. PILLARS — Each pillar analyzed sequentially with score computation
 * 4. PROBABILITY — Scaling probability engine computation with variables
 * 5. REVEAL — Final score locks in, screen transitions to report
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PILLARS, getBandColor, getBandLabel, getProbabilityColor, getProbabilityLabel } from '@/lib/sos-engine';
import type { SOSResult, ScalingProbability, SubcategoryInput } from '@/lib/sos-engine';

interface CalculationBoardProps {
  result: SOSResult;
  probability: ScalingProbability;
  inputs: Record<string, SubcategoryInput>;
  shopName: string;
  onComplete: () => void;
}

type Stage = 'boot' | 'intake' | 'pillars' | 'probability' | 'reveal';

// Random hex string generator for visual effect
function randomHex(len: number): string {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Terminal text that types out
function TypeWriter({ text, delay = 0, speed = 25, className = '', onDone }: {
  text: string; delay?: number; speed?: number; className?: string; onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(t);
  }, [started, displayed, text, speed, onDone]);

  return (
    <span className={className}>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="animate-pulse text-gold">▌</span>
      )}
    </span>
  );
}

// Flickering data stream
function DataStream({ lines, active }: { lines: string[]; active: boolean }) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        setVisibleLines(prev => [...prev, lines[i]]);
        i++;
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [active, lines]);

  return (
    <div ref={containerRef} className="font-data text-[10px] leading-tight h-32 overflow-hidden opacity-60">
      {visibleLines.map((line, i) => (
        <div key={i} className="text-gold/70 whitespace-nowrap overflow-hidden">
          <span className="text-gold/30">[0x{randomHex(4)}]</span> {line}
        </div>
      ))}
    </div>
  );
}

// Animated counter
function Counter({ target, duration = 1500, delay = 0, suffix = '', prefix = '', decimals = 0, className = '' }: {
  target: number; duration?: number; delay?: number; suffix?: string; prefix?: string; decimals?: number; className?: string;
}) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return (
    <span className={className}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
}

export default function CalculationBoard({ result, probability, inputs, shopName, onComplete }: CalculationBoardProps) {
  const [stage, setStage] = useState<Stage>('boot');
  const [pillarIndex, setPillarIndex] = useState(-1);
  const [showFinalScore, setShowFinalScore] = useState(false);

  // Generate data stream lines from actual inputs
  const dataStreamLines = Object.entries(inputs)
    .filter(([, v]) => v.score > 0)
    .map(([id, v]) => {
      const pillar = PILLARS.find(p => p.subcategories.some(s => s.id === id));
      const sub = pillar?.subcategories.find(s => s.id === id);
      return `LOAD ${sub?.label?.toUpperCase().slice(0, 28).padEnd(28, '.')} w=${sub?.weight || 0} s=${v.score}/5 → ${((v.score / 5) * 100).toFixed(0)}%`;
    });

  // Stage progression
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Boot → Intake
    timers.push(setTimeout(() => setStage('intake'), 2000));

    // Intake → Pillars
    timers.push(setTimeout(() => setStage('pillars'), 4500));

    // Animate pillars one by one
    timers.push(setTimeout(() => setPillarIndex(0), 5000));
    timers.push(setTimeout(() => setPillarIndex(1), 6200));
    timers.push(setTimeout(() => setPillarIndex(2), 7400));
    timers.push(setTimeout(() => setPillarIndex(3), 8600));

    // Pillars → Probability
    timers.push(setTimeout(() => setStage('probability'), 10000));

    // Probability → Reveal
    timers.push(setTimeout(() => setStage('reveal'), 13000));
    timers.push(setTimeout(() => setShowFinalScore(true), 13500));

    // Complete → transition to report
    timers.push(setTimeout(() => onComplete(), 16000));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const scoreColor = getBandColor(result.band);
  const probColor = getProbabilityColor(probability.overall);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(200,150,46,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,150,46,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        initial={{ top: 0 }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold/30" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold/30" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold/30" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold/30" />

      {/* Status bar top */}
      <div className="absolute top-0 left-0 right-0 h-10 border-b border-gold/10 bg-black/80 flex items-center px-4 sm:px-6 gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage === 'reveal' ? 'bg-[#2ECC71]' : 'bg-gold animate-pulse'}`} />
          <span className="font-data text-[10px] text-gold/60 tracking-widest uppercase">
            SOS ANALYSIS ENGINE v4.0
          </span>
        </div>
        <div className="flex-1" />
        <span className="font-data text-[10px] text-gold/40">
          {shopName.toUpperCase()}
        </span>
        <span className="font-data text-[10px] text-gold/30">
          {new Date().toISOString().replace('T', ' ').slice(0, 19)}
        </span>
      </div>

      {/* Main content area */}
      <div className="relative w-full max-w-4xl mx-auto px-6 sm:px-10">
        <AnimatePresence mode="wait">

          {/* ═══ STAGE 1: BOOT ═══ */}
          {stage === 'boot' && (
            <motion.div
              key="boot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="font-data text-xs space-y-1">
                <TypeWriter text="[SOS] Initializing Scale Toolkit..." delay={100} className="text-gold/80 block" />
                <TypeWriter text="[SOS] Loading assessment matrix (30 variables)..." delay={600} className="text-gold/60 block" />
                <TypeWriter text="[SOS] Connecting to probability engine..." delay={1100} className="text-gold/60 block" />
                <TypeWriter text={`[SOS] Target: ${shopName} | Tier: ${probability.tierLabel}`} delay={1500} className="text-gold block" />
                <TypeWriter text="[SOS] Ready. Beginning analysis..." delay={1800} className="text-[#2ECC71] block" />
              </div>
            </motion.div>
          )}

          {/* ═══ STAGE 2: DATA INTAKE ═══ */}
          {stage === 'intake' && (
            <motion.div
              key="intake"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="font-data text-xs text-gold tracking-widest uppercase">
                  Phase 1 — Data Intake
                </span>
                <div className="flex-1 h-px bg-gold/10" />
                <span className="font-data text-[10px] text-gold/40">
                  {Object.values(inputs).filter(v => v.score > 0).length} variables loaded
                </span>
              </div>

              <DataStream lines={dataStreamLines} active={true} />

              {/* Progress bar */}
              <div className="h-1 rounded-full bg-gold/10 overflow-hidden">
                <motion.div
                  className="h-full bg-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
              </div>

              <div className="font-data text-[10px] text-gold/40 text-center">
                Scanning subcategory weights and normalizing input vectors...
              </div>
            </motion.div>
          )}

          {/* ═══ STAGE 3: PILLAR ANALYSIS ═══ */}
          {stage === 'pillars' && (
            <motion.div
              key="pillars"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="font-data text-xs text-gold tracking-widest uppercase">
                  Phase 2 — Pillar Analysis
                </span>
                <div className="flex-1 h-px bg-gold/10" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {result.pillars.map((pillar, i) => {
                  const isActive = pillarIndex >= i;
                  const isProcessing = pillarIndex === i;
                  const color = getBandColor(pillar.band);

                  return (
                    <motion.div
                      key={pillar.id}
                      initial={{ opacity: 0.2, scale: 0.95 }}
                      animate={{
                        opacity: isActive ? 1 : 0.2,
                        scale: isActive ? 1 : 0.95,
                        borderColor: isProcessing ? 'rgba(200,150,46,0.5)' : isActive ? 'rgba(200,150,46,0.15)' : 'rgba(200,150,46,0.05)',
                      }}
                      transition={{ duration: 0.5 }}
                      className="rounded-xl border bg-black/40 p-3 sm:p-4 relative overflow-hidden"
                    >
                      {isProcessing && (
                        <motion.div
                          className="absolute inset-0 bg-gold/[0.03]"
                          animate={{ opacity: [0, 0.08, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <span className="font-data text-[10px] text-gold/60 uppercase tracking-wider">
                          {pillar.label}
                        </span>
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-data text-sm font-bold"
                            style={{ color }}
                          >
                            <Counter target={pillar.percentage} duration={800} suffix="%" decimals={0} />
                          </motion.span>
                        )}
                      </div>

                      {/* Mini bar chart of subcategories */}
                      <div className="flex gap-0.5 h-6">
                        {pillar.subcategories.map((sub, j) => (
                          <motion.div
                            key={sub.id}
                            className="flex-1 rounded-sm relative overflow-hidden"
                            style={{ backgroundColor: 'rgba(200,150,46,0.06)' }}
                          >
                            {isActive && (
                              <motion.div
                                className="absolute bottom-0 left-0 right-0 rounded-sm"
                                style={{ backgroundColor: color }}
                                initial={{ height: 0 }}
                                animate={{ height: `${(sub.score / 5) * 100}%` }}
                                transition={{ duration: 0.4, delay: j * 0.05 }}
                              />
                            )}
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-data text-[8px] text-gold/30">
                          {pillar.subcategories.length} metrics
                        </span>
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-data text-[8px] uppercase tracking-wider"
                            style={{ color }}
                          >
                            {getBandLabel(pillar.band)}
                          </motion.span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ STAGE 4: PROBABILITY ENGINE ═══ */}
          {stage === 'probability' && (
            <motion.div
              key="probability"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="font-data text-xs text-gold tracking-widest uppercase">
                  Phase 3 — Probability Engine
                </span>
                <div className="flex-1 h-px bg-gold/10" />
                <span className="font-data text-[10px] text-gold/40">
                  Sigmoid Model · {probability.tierLabel}
                </span>
              </div>

              {/* Variable matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {probability.pillarContributions.map((pc, i) => (
                  <motion.div
                    key={pc.pillarId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.3 }}
                    className="rounded-lg border border-gold/10 bg-black/40 p-3 text-center"
                  >
                    <div className="font-data text-[9px] text-gold/40 uppercase tracking-wider mb-1">
                      {pc.label}
                    </div>
                    <div className="font-data text-lg font-bold text-gold">
                      <Counter target={pc.score} delay={i * 300} duration={800} suffix="%" decimals={0} />
                    </div>
                    <div className="font-data text-[8px] text-gold/30 mt-0.5">
                      weight: {pc.weight}%
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Computation visualization */}
              <div className="rounded-lg border border-gold/10 bg-black/40 p-4">
                <div className="font-data text-[10px] text-gold/50 space-y-1">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <span className="text-gold/30">→</span> Weighted composite score: <span className="text-gold">{result.percentage.toFixed(1)}%</span>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
                    <span className="text-gold/30">→</span> Sigmoid transform: f(x) = 100 / (1 + e<sup>-k(x-μ)</sup>)
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                    <span className="text-gold/30">→</span> Critical pillar penalties applied...
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}>
                    <span className="text-gold/30">→</span> Final probability: <span className="text-gold font-bold">{probability.overall.toFixed(1)}%</span>
                  </motion.div>
                </div>
              </div>

              {/* Animated probability bar */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-data text-[9px] text-gold/40">SCALING PROBABILITY</span>
                  <span className="font-data text-[9px]" style={{ color: probColor }}>
                    <Counter target={probability.overall} delay={1500} duration={1000} suffix="%" decimals={1} />
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gold/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: probColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${probability.overall}%` }}
                    transition={{ duration: 1.5, delay: 1.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ STAGE 5: REVEAL ═══ */}
          {stage === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full blur-2xl" style={{
                  background: `radial-gradient(circle, ${scoreColor}33 0%, transparent 70%)`,
                  transform: 'scale(2)',
                }} />

                {/* Score ring SVG */}
                <svg width="200" height="200" viewBox="0 0 200 200" className="relative z-10">
                  <defs>
                    <filter id="calc-glow">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Background ring */}
                  <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(200,150,46,0.08)" strokeWidth="6" />
                  {/* Score ring */}
                  {showFinalScore && (
                    <motion.circle
                      cx="100" cy="100" r="85" fill="none"
                      stroke={scoreColor}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 85}
                      initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - result.percentage / 100) }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                      transform="rotate(-90 100 100)"
                      filter="url(#calc-glow)"
                    />
                  )}
                  {/* Center text */}
                  <text x="100" y="92" textAnchor="middle" fill="white" fontFamily="'JetBrains Mono'" fontWeight="800" fontSize="48">
                    {showFinalScore ? Math.round(result.percentage) : '—'}
                  </text>
                  <text x="100" y="115" textAnchor="middle" fill={scoreColor} fontFamily="'Space Grotesk'" fontWeight="600" fontSize="11" letterSpacing="0.15em">
                    {getBandLabel(result.band).toUpperCase()}
                  </text>
                  <text x="100" y="135" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontFamily="'Space Grotesk'" fontSize="9" letterSpacing="0.2em">
                    SOS SCORE
                  </text>
                </svg>
              </motion.div>

              {/* Pillar summary row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 sm:gap-6"
              >
                {result.pillars.map(p => (
                  <div key={p.id} className="text-center">
                    <div className="font-data text-[9px] text-gold/40 uppercase tracking-wider mb-0.5">
                      {p.label}
                    </div>
                    <div className="font-data text-sm font-bold" style={{ color: getBandColor(p.band) }}>
                      {p.percentage.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Probability */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="font-data text-[10px] text-gold/50"
              >
                Scaling Probability: <span className="font-bold" style={{ color: probColor }}>{probability.overall.toFixed(1)}%</span>
                <span className="text-gold/30"> · {getProbabilityLabel(probability.overall)}</span>
              </motion.div>

              {/* Loading into report */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
                <span className="font-data text-[10px] text-gold/40">
                  Generating intelligence report...
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-gold/10 bg-black/80 flex items-center px-4 sm:px-6 gap-4">
        <div className="flex items-center gap-3">
          {(['boot', 'intake', 'pillars', 'probability', 'reveal'] as Stage[]).map((s, i) => {
            const stageOrder = ['boot', 'intake', 'pillars', 'probability', 'reveal'];
            const currentIdx = stageOrder.indexOf(stage);
            const isComplete = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  isComplete ? 'bg-[#2ECC71]' : isCurrent ? 'bg-gold animate-pulse' : 'bg-gold/20'
                }`} />
                <span className={`font-data text-[8px] uppercase tracking-wider transition-colors duration-300 ${
                  isComplete ? 'text-[#2ECC71]/60' : isCurrent ? 'text-gold/60' : 'text-gold/20'
                }`}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex-1" />
        <span className="font-data text-[8px] text-gold/20">
          SCALE OPERATING SYSTEM · CONFIDENTIAL
        </span>
      </div>
    </div>
  );
}
