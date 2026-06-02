/*
 * OverallScore v3 — Hero section with percentage gauge + real-time scaling probability
 * Shows overall SOS percentage and probability of scaling side by side.
 */
import { motion } from 'framer-motion';
import { getBandColor, getBandLabel, getProbabilityColor, getProbabilityLabel } from '@/lib/sos-engine';
import type { SOSResult, ScalingProbability } from '@/lib/sos-engine';
import GaugeArc from './GaugeArc';

interface OverallScoreProps {
  result: SOSResult | null;
  probability: ScalingProbability | null;
}

const HERO_BG = "https://private-us-east-1.manuscdn.com/sessionFile/CJ6sy7cwVtapV2SvEkWmDr/sandbox/wDdNhOYA5ld3wakPdtX1Wq-img-1_1771980521000_na1fn_c29zLWhlcm8tYmctZ29sZA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvQ0o2c3k3Y3dWdGFwVjJTdkVrV21Eci9zYW5kYm94L3dEZE5oT1lBNWxkM3dha1BkdFgxV3EtaW1nLTFfMTc3MTk4MDUyMTAwMF9uYTFmbl9jMjl6TFdobGNtOHRZbWN0WjI5c1pBLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=VIRsCQbQz6jMBMnTS~YbhJoaiOpFyDPOunLTDLFLfSBf3kzd3kEECppmnjsjdlWHUFaT1FscB6T1Wn7-FDajydF0Q6P9kgS85nbT~4zJO-FjzpLuNzVp8bBW-~j39H-JzZHtOvegy0QCuNidyv3qoASwhippHqM9s8J6FNh2oY-cQUc4Ye~AdREiu9ogaIlxzqVgRLHMgM5HpVy1P~K~86rlF16mIyVp3ASInwJkqegyn2mlIB5CCJVysFC93b5YCAHl3fMkbkg1~J2ALYVGl~q3MIazwWodz8A8RgYxGc7ZmP9LfC6gjaSvmm3KjIqqBJn~NkjUzaNc64F~oGh-GA__";

export default function OverallScore({ result, probability }: OverallScoreProps) {
  const band = result?.band || 'red';
  const bandColor = result ? getBandColor(band) : 'oklch(0.58 0.015 260)';
  const pct = result?.percentage ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card">
      {/* Background image */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/90" />

      <div className="relative z-10 p-5 sm:p-6 md:p-8">
        {/* Top: Logo + title */}
        <div className="flex items-center gap-3 mb-5">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
            alt="Scale Detailing"
            className="h-9 w-auto"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              SOS <span className="text-gold">Assessment</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">Scale Toolkit · Internal Assessment</p>
          </div>
        </div>

        {/* Main content: Gauge + Probability + Pillar bars */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Overall gauge */}
          <div className="shrink-0">
            <GaugeArc
              value={pct}
              max={100}
              band={result ? band : 'red'}
              label="SOS SCORE"
              size={180}
              suffix="%"
            />
            {result && (
              <div className="text-center mt-2">
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${bandColor}18`,
                    color: bandColor,
                    border: `1px solid ${bandColor}30`,
                  }}
                >
                  {getBandLabel(band)}
                </span>
              </div>
            )}
          </div>

          {/* Scaling probability (assessor view — simple) */}
          {probability && (
            <div className="flex-1 min-w-0">
              <div className="rounded-xl border border-border/20 bg-muted/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Scaling Probability → {probability.tierLabel}
                </p>
                <div className="flex items-end gap-2">
                  <span
                    className="font-data text-3xl sm:text-4xl font-bold"
                    style={{ color: getProbabilityColor(probability.overall) }}
                  >
                    {probability.overall.toFixed(0)}%
                  </span>
                  <span
                    className="text-xs font-semibold mb-1"
                    style={{ color: getProbabilityColor(probability.overall) }}
                  >
                    {getProbabilityLabel(probability.overall)}
                  </span>
                </div>

                {/* Pillar contribution bars */}
                <div className="mt-3 space-y-1.5">
                  {result?.pillars.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-16 shrink-0">
                        {p.label}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: getBandColor(p.band) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${p.percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="font-data text-[10px] w-8 text-right" style={{ color: getBandColor(p.band) }}>
                        {p.percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && (
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm text-muted-foreground/60 italic">
                Score each subcategory below to see your results and scaling probability here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
