/*
 * ResultsSummary v3 — Tabular summary + export (percentage-based)
 * Weights hidden from display. Shows score, percentage contribution, gap.
 */
import { Download, Copy, Check } from 'lucide-react';
import { useState, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { getBandColor, getBandLabel } from '@/lib/sos-engine';
import type { SOSResult, SubcategoryInput } from '@/lib/sos-engine';

interface ResultsSummaryProps {
  result: SOSResult;
  inputs: Record<string, SubcategoryInput>;
}

export default function ResultsSummary({ result, inputs }: ResultsSummaryProps) {
  const [copied, setCopied] = useState(false);

  const exportData = {
    timestamp: new Date().toISOString(),
    percentage: result.percentage,
    band: result.band,
    pillars: result.pillars.map(p => ({
      id: p.id,
      label: p.label,
      percentage: p.percentage,
      band: p.band,
      subcategories: p.subcategories.map(s => ({
        id: s.id,
        label: s.label,
        score: s.score,
        gapPoints: s.gapPoints,
        weightedDeficit: s.weightedDeficit,
        note: inputs[s.id]?.note || '',
      })),
    })),
    topLeveragePriorities: result.topLeveragePriorities.map(p => ({
      id: p.id,
      label: p.label,
      pillar: p.pillarLabel,
      gapPoints: p.gapPoints,
      weightedDeficit: p.weightedDeficit,
    })),
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sos-scorecard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Full Breakdown
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyJSON}
            className="h-7 text-xs gap-1.5 border-border/40"
          >
            {copied ? <Check size={12} className="text-[#2ECC71]" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy JSON'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJSON}
            className="h-7 text-xs gap-1.5 border-border/40"
          >
            <Download size={12} />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-muted/10">
              <th className="text-left px-4 py-2.5 font-bold uppercase tracking-wider text-muted-foreground">Pillar</th>
              <th className="text-left px-4 py-2.5 font-bold uppercase tracking-wider text-muted-foreground">Subcategory</th>
              <th className="text-center px-3 py-2.5 font-bold uppercase tracking-wider text-muted-foreground">Score</th>
              <th className="text-center px-3 py-2.5 font-bold uppercase tracking-wider text-muted-foreground">Deficit</th>
              <th className="text-left px-4 py-2.5 font-bold uppercase tracking-wider text-muted-foreground">Note</th>
            </tr>
          </thead>
          <tbody>
            {result.pillars.map((pillar) => (
              <Fragment key={pillar.id}>
                {pillar.subcategories.map((sub, i) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border/10 hover:bg-white/[0.02] transition-colors"
                  >
                    {i === 0 && (
                      <td
                        rowSpan={pillar.subcategories.length}
                        className="px-4 py-2 align-top font-bold text-foreground border-r border-border/10"
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: getBandColor(pillar.band) }}
                          />
                          {pillar.label}
                        </div>
                        <div className="font-data text-[10px] mt-1" style={{ color: getBandColor(pillar.band) }}>
                          {pillar.percentage.toFixed(0)}%
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-2 text-foreground">{sub.label}</td>
                    <td className="px-3 py-2 text-center font-data font-bold text-foreground">{sub.score}/5</td>
                    <td className="px-3 py-2 text-center font-data text-[#D4A843]">
                      {sub.weightedDeficit > 0 ? sub.weightedDeficit.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate">
                      {inputs[sub.id]?.note || '—'}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gold/30 bg-gold/5">
              <td colSpan={2} className="px-4 py-3 font-bold uppercase tracking-wider text-gold">
                Total SOS Score
              </td>
              <td className="px-3 py-3 text-center font-data text-lg font-bold text-gold">
                {result.percentage.toFixed(0)}%
              </td>
              <td colSpan={2} className="px-4 py-3">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${getBandColor(result.band)}18`,
                    color: getBandColor(result.band),
                  }}
                >
                  {getBandLabel(result.band)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
