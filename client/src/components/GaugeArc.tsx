/*
 * GaugeArc v3 — SVG arc gauge for scores
 * Supports percentage display with optional suffix.
 */
import { motion } from 'framer-motion';
import { getBandColor } from '@/lib/sos-engine';

interface GaugeArcProps {
  value: number;
  max: number;
  band: 'green' | 'yellow' | 'red';
  label: string;
  size?: number;
  suffix?: string; // e.g. "%" — shown after the number
}

export default function GaugeArc({ value, max, band, label, size = 160, suffix }: GaugeArcProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;

  // Arc from 225° to -45° (270° sweep)
  const startAngle = 225;
  const endAngle = -45;
  const totalAngle = startAngle - endAngle; // 270
  const percentage = max > 0 ? Math.min(value / max, 1) : 0;
  const sweepAngle = percentage * totalAngle;

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startDeg: number, sweepDeg: number) => {
    if (sweepDeg <= 0) return '';
    const start = polarToCartesian(cx, cy, r, startDeg);
    const end = polarToCartesian(cx, cy, r, startDeg - sweepDeg);
    const largeArc = sweepDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const bgPath = describeArc(center, center, radius, startAngle, totalAngle);
  const valuePath = describeArc(center, center, radius, startAngle, sweepAngle);
  const color = value > 0 ? getBandColor(band) : 'oklch(0.30 0.01 260)';
  const displayValue = suffix ? `${Math.round(value)}` : value > 0 ? value.toFixed(1) : '—';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${label.replace(/\s/g, '')}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="oklch(0.18 0.008 260)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const tickAngle = startAngle - pct * totalAngle;
          const inner = polarToCartesian(center, center, radius - strokeWidth / 2 - 2, tickAngle);
          const outer = polarToCartesian(center, center, radius - strokeWidth / 2 - 6, tickAngle);
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="oklch(0.30 0.01 260)"
              strokeWidth={1}
            />
          );
        })}

        {/* Value arc */}
        {sweepAngle > 0.5 && (
          <motion.path
            d={valuePath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter={value > 0 ? `url(#glow-${label.replace(/\s/g, '')})` : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}

        {/* Center score */}
        <text
          x={suffix ? center - 4 : center}
          y={center - 4}
          textAnchor="middle"
          dominantBaseline="central"
          fill={value > 0 ? 'white' : 'oklch(0.40 0.01 260)'}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="700"
          fontSize={size * 0.18}
        >
          {displayValue}
        </text>
        {suffix && value > 0 && (
          <text
            x={center + size * 0.15}
            y={center - 4}
            textAnchor="start"
            dominantBaseline="central"
            fill="oklch(0.55 0.015 260)"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="500"
            fontSize={size * 0.10}
          >
            {suffix}
          </text>
        )}
        {!suffix && (
          <text
            x={center}
            y={center + size * 0.13}
            textAnchor="middle"
            dominantBaseline="central"
            fill="oklch(0.45 0.015 260)"
            fontFamily="'Space Grotesk', sans-serif"
            fontWeight="500"
            fontSize={size * 0.07}
          >
            / {max}
          </text>
        )}
      </svg>
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
