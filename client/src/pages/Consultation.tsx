/*
 * Consultation Page — Public shareable consultation report at /consultation?d=<encoded>
 * No login required. Shows the full ConsultationReport sales presentation.
 * Prospects can change their revenue target and goal revenue, and see everything update in real-time.
 */
import { useMemo, useState } from 'react';
import { useSearch } from 'wouter';
import { decodeConsultationURL } from '@/lib/consultation-url';
import { computeSOS, computeScalingProbability } from '@/lib/sos-engine';
import type { RevenueTier } from '@/lib/sos-engine';
import ConsultationReport from '@/components/ConsultationReport';

export default function Consultation() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const encodedData = params.get('d');

  const decoded = useMemo(() => {
    if (!encodedData) return null;
    return decodeConsultationURL(encodedData);
  }, [encodedData]);

  // Manage revenue tier as state so the prospect can change it
  const [activeTier, setActiveTier] = useState<RevenueTier | null>(null);
  const [activeCustomTarget, setActiveCustomTarget] = useState<number | null>(null);

  // Manage goal revenue as state so the prospect can change their growth target
  const [activeGoalRevenue, setActiveGoalRevenue] = useState<number | null>(null);

  // Effective tier: use active (user-selected) or fall back to encoded data
  const effectiveTier = activeTier ?? decoded?.revenueTier ?? '20-30';
  const effectiveCustomTarget = activeTier === 'custom'
    ? (activeCustomTarget ?? decoded?.customTarget ?? 60000)
    : (decoded?.customTarget ?? undefined);

  // Effective goal revenue: use active or fall back to encoded
  const effectiveGoalRevenue = activeGoalRevenue ?? decoded?.goalRevenue;

  const result = useMemo(() => {
    if (!decoded) return null;
    return computeSOS(decoded.inputs);
  }, [decoded]);

  const probability = useMemo(() => {
    if (!result || !decoded) return null;
    return computeScalingProbability(
      result,
      effectiveTier,
      effectiveTier === 'custom' ? effectiveCustomTarget : undefined
    );
  }, [result, decoded, effectiveTier, effectiveCustomTarget]);

  const handleTierChange = (tier: RevenueTier, custom?: number) => {
    setActiveTier(tier);
    if (tier === 'custom' && custom !== undefined) {
      setActiveCustomTarget(custom);
    } else if (tier !== 'custom') {
      setActiveCustomTarget(null);
    }
  };

  const handleGoalRevenueChange = (goalRevenue: number) => {
    setActiveGoalRevenue(goalRevenue);
  };

  if (!decoded || !result || !probability) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
            alt="Scale Detailing"
            className="h-12 w-auto mx-auto opacity-60 mb-4"
          />
          <h1 className="text-xl font-bold text-foreground">Consultation Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This consultation link is invalid or has expired. Please contact your Scale Detailing consultant for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConsultationReport
      result={result}
      inputs={decoded.inputs}
      meta={decoded.meta}
      probability={probability}
      customerLogoUrl={decoded.logoUrl}
      revenueTier={effectiveTier}
      customTarget={effectiveCustomTarget}
      currentRevenue={decoded.currentRevenue}
      goalRevenue={effectiveGoalRevenue}
      businessProfile={decoded.businessProfile}
      onTierChange={handleTierChange}
      onGoalRevenueChange={handleGoalRevenueChange}
    />
  );
}
